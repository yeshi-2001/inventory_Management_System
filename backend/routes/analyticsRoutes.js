const express  = require("express");
const axios    = require("axios");
const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");
const { query, validationResult } = require("express-validator");
const { getSalesSummary, getDailySalesBreakdown, getStockLevelOverTime, sanitizeDateRange } = require("../db/analyticsQueries");

const router = express.Router();
const PYTHON_URL = process.env.PYTHON_SERVICE_URL || process.env.PYTHON_ANALYTICS_URL || "http://localhost:8000";
const AXIOS_TIMEOUT = 10000;

// ─── In-memory summary cache (5 min TTL) ─────────────────────────────────────
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

const getCached = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
};
const setCache = (key, data) => cache.set(key, { data, ts: Date.now() });

// ─── Helpers ──────────────────────────────────────────────────────────────────

const resolveDateRange = (period, startDate, endDate) => {
  if (period === "custom") {
    return sanitizeDateRange(startDate, endDate);
  }
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  const days = period === "7" ? 7 : period === "90" ? 90 : 30;
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return { start, end };
};

const pingPython = async () => {
  const res = await axios.get(`${PYTHON_URL}/analytics/health`, { timeout: AXIOS_TIMEOUT });
  return res.data?.status === "ok";
};

const callPythonAnalysis = async (periodDays, items) => {
  const res = await axios.post(
    `${PYTHON_URL}/analytics/stock-analysis`,
    { period_days: periodDays, items },
    { timeout: AXIOS_TIMEOUT }
  );
  return res.data;
};

// ─── Validation rules ─────────────────────────────────────────────────────────

const stockReportValidation = [
  query("period").optional().isIn(["7", "30", "90", "custom"]).withMessage("period must be 7, 30, 90, or custom"),
  query("startDate").if(query("period").equals("custom")).notEmpty().isISO8601().withMessage("startDate required for custom period"),
  query("endDate").if(query("period").equals("custom")).notEmpty().isISO8601().withMessage("endDate required for custom period"),
  query("itemId").optional().isInt({ min: 1 }).withMessage("itemId must be a positive integer"),
];

// ─── ROUTE 1: GET /api/analytics/stock-report ────────────────────────────────

router.get("/stock-report", stockReportValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array().map((e) => ({ field: e.path, message: e.msg })) });

  try {
    const { period = "30", startDate, endDate, itemId } = req.query;
    const { start, end } = resolveDateRange(period, startDate, endDate);
    const periodDays = Math.ceil((end - start) / 86400000);

    // 1. Fetch sales summary from PostgreSQL
    const summaryRows = await getSalesSummary(start, end, itemId || null);

    // 2. Ping Python service
    let pythonUp = false;
    try { pythonUp = await pingPython(); } catch {}
    if (!pythonUp)
      return res.status(503).json({ success: false, error: "Analytics service unavailable" });

    // 3. Call Python analysis
    const pythonResult = await callPythonAnalysis(periodDays, summaryRows);

    res.json({
      success: true,
      period: { start: start.toISOString(), end: end.toISOString(), days: periodDays },
      data: pythonResult.data,
      skipped: pythonResult.skipped || [],
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ROUTE 2: GET /api/analytics/chart-data/:inventoryId ─────────────────────

router.get("/chart-data/:inventoryId", async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate)
      return res.status(400).json({ success: false, error: "startDate and endDate are required" });

    const [salesRows, stockRows] = await Promise.all([
      getDailySalesBreakdown(inventoryId, startDate, endDate),
      getStockLevelOverTime(inventoryId, startDate, endDate),
    ]);

    const salesTrend = salesRows.map((r) => ({
      date: r.saleDate instanceof Date ? r.saleDate.toISOString().split("T")[0] : String(r.saleDate).split("T")[0],
      sold: Number(r.quantitySold),
    }));

    const stockLevel = stockRows.map((r) => ({
      date: r.date instanceof Date ? r.date.toISOString().split("T")[0] : String(r.date).split("T")[0],
      quantity: Number(r.quantity),
    }));

    res.json({ success: true, data: { salesTrend, stockLevel } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ROUTE 3: GET /api/analytics/summary ─────────────────────────────────────

router.get("/summary", async (req, res) => {
  try {
    const cached = getCached("summary");
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const { prisma } = require("../db");

    // Run all summary queries directly in PostgreSQL — no Python dependency
    const cutoff14 = new Date(Date.now() - 14 * 86400000);
    const cutoff30 = new Date(Date.now() - 30 * 86400000);

    const [countRows, valueRows, deadRows] = await Promise.all([
      // total items, low stock count
      prisma.$queryRaw`
        SELECT
          COUNT(*)::int                                                     AS "totalItems",
          COUNT(CASE WHEN quantity <= min_quantity THEN 1 END)::int         AS "lowStockCount",
          COUNT(CASE WHEN quantity = 0            THEN 1 END)::int         AS "urgentCount"
        FROM inventory
      `,
      // total stock value
      prisma.$queryRaw`
        SELECT COALESCE(SUM(quantity * unit_price), 0)::numeric AS "totalStockValue"
        FROM inventory
      `,
      // dead stock: zero OUT transactions in last 14 days
      prisma.$queryRaw`
        SELECT COUNT(DISTINCT i.id)::int AS "deadStockCount"
        FROM inventory i
        WHERE NOT EXISTS (
          SELECT 1 FROM transactions t
          WHERE t.inventory_id = i.id
            AND t.type = 'OUT'
            AND t.created_at >= ${cutoff14}
        )
      `,
    ]);

    const summary = {
      totalItems:      Number(countRows[0]?.totalItems      || 0),
      urgentCount:     Number(countRows[0]?.urgentCount     || 0),
      lowStockCount:   Number(countRows[0]?.lowStockCount   || 0),
      deadStockCount:  Number(deadRows[0]?.deadStockCount   || 0),
      overstockCount:  0, // requires Python analysis — shown after running report
      totalStockValue: Number(valueRows[0]?.totalStockValue || 0),
    };

    setCache("summary", summary);
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── ROUTE 4: GET /api/analytics/export ──────────────────────────────────────
// Supports token via query param for direct browser download links
router.get("/export", async (req, res) => {
  // Allow token from query string for direct download (browser can't set headers)
  if (!req.user && req.query.token) {
    try {
      const { verifyToken } = require("../utils/jwt");
      req.user = verifyToken(req.query.token);
    } catch {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }
  }
  if (!req.user) return res.status(401).json({ success: false, error: "No token provided" });
  try {
    const { period = "30", startDate, endDate, format = "csv" } = req.query;

    if (!["csv", "pdf"].includes(format))
      return res.status(400).json({ success: false, error: "format must be csv or pdf" });

    const { start, end } = resolveDateRange(period, startDate, endDate);
    const periodDays = Math.ceil((end - start) / 86400000);
    const summaryRows = await getSalesSummary(start, end);

    let pythonUp = false;
    try { pythonUp = await pingPython(); } catch {}
    if (!pythonUp)
      return res.status(503).json({ success: false, error: "Analytics service unavailable" });

    const pythonResult = await callPythonAnalysis(periodDays, summaryRows);
    const items = pythonResult.data || [];
    const dateLabel = `${start.toISOString().split("T")[0]}_to_${end.toISOString().split("T")[0]}`;

    // ── CSV ──────────────────────────────────────────────────────────────────
    if (format === "csv") {
      const fields = [
        { label: "Item Name",        value: "itemName"          },
        { label: "Unit Price (Rs.)",  value: "unitPrice"         },
        { label: "Current Qty",      value: "currentQuantity"   },
        { label: "Avg Daily Sales",  value: "avgDailySales"     },
        { label: "Days to Stockout", value: "daysToStockout"    },
        { label: "Reorder Qty",      value: "recommendedOrderQty" },
        { label: "Status",           value: "stockStatus"       },
        { label: "Insight",          value: "insight"           },
      ];
      const parser = new Parser({ fields });
      const csv = parser.parse(items);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="stock-report-${dateLabel}.csv"`);
      return res.send(csv);
    }

    // ── PDF ──────────────────────────────────────────────────────────────────
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="stock-report-${dateLabel}.pdf"`);
    doc.pipe(res);

    const STATUS_COLORS = {
      urgent:     "#dc2626",
      low_stock:  "#d97706",
      dead_stock: "#6b7280",
      overstock:  "#2563eb",
      normal:     "#16a34a",
    };

    // Header
    doc.fontSize(18).fillColor("#111827").text("Stock Analysis Report", { align: "center" });
    doc.fontSize(11).fillColor("#6b7280").text(
      `Period: ${start.toDateString()} — ${end.toDateString()}`,
      { align: "center" }
    );
    doc.moveDown();

    // Summary box
    const urgent   = items.filter((i) => i.stockStatus === "urgent").length;
    const lowStock = items.filter((i) => i.stockStatus === "low_stock").length;
    const dead     = items.filter((i) => i.stockStatus === "dead_stock").length;
    const totalVal = summaryRows.reduce((s, r) => s + (Number(r.currentQuantity) * 0), 0);

    doc.fontSize(11).fillColor("#111827");
    doc.text(`Total Items: ${items.length}   |   Urgent: ${urgent}   |   Low Stock: ${lowStock}   |   Dead Stock: ${dead}`);
    doc.moveDown();

    // Stock value
    const totalValue = summaryRows.reduce((s, r) => s + (Number(r.currentQuantity || 0) * Number(r.unitPrice || 0)), 0);
    doc.fontSize(10).text(`Total Stock Value: Rs. ${totalValue.toLocaleString("en-LK", { minimumFractionDigits: 2 })}`);
    doc.moveDown();

    // Table header
    const cols = { name: 40, qty: 220, avg: 270, days: 320, reorder: 375, status: 430 };
    doc.fontSize(9).fillColor("#374151").font("Helvetica-Bold");
    doc.text("Item Name",       cols.name,   doc.y, { continued: true, width: 175 });
    doc.text("Qty",             cols.qty,    doc.y, { continued: true, width: 45  });
    doc.text("Avg/Day",         cols.avg,    doc.y, { continued: true, width: 45  });
    doc.text("Days Left",       cols.days,   doc.y, { continued: true, width: 50  });
    doc.text("Reorder",         cols.reorder,doc.y, { continued: true, width: 50  });
    doc.text("Status",          cols.status, doc.y, { width: 80 });
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke("#e5e7eb");
    doc.moveDown(0.3);

    // Table rows
    doc.font("Helvetica").fontSize(8);
    items.forEach((item) => {
      const y = doc.y;
      const color = STATUS_COLORS[item.stockStatus] || "#111827";
      doc.fillColor("#111827").text(item.itemName,                                cols.name,    y, { continued: true, width: 175 });
      doc.text(String(item.currentQuantity),                                      cols.qty,     y, { continued: true, width: 45  });
      doc.text(String(item.avgDailySales),                                        cols.avg,     y, { continued: true, width: 45  });
      doc.text(item.daysToStockout != null ? String(item.daysToStockout) : "N/A", cols.days,    y, { continued: true, width: 50  });
      doc.text(String(item.recommendedOrderQty),                                  cols.reorder, y, { continued: true, width: 50  });
      doc.fillColor(color).text(item.stockStatus,                                 cols.status,  y, { width: 80 });
      doc.moveDown(0.2);
    });

    // Footer
    doc.moveDown();
    doc.fontSize(8).fillColor("#9ca3af")
      .text(`Generated on ${new Date().toLocaleString()} by Inventory Management System`, { align: "center" });

    doc.end();
  } catch (err) {
    if (!res.headersSent)
      res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
