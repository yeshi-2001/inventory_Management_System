const express = require("express");
const { body, query, validationResult } = require("express-validator");
const { prisma } = require("../db");
const { processCheckout } = require("../services/checkoutService");
const { sendBillEmail } = require("../utils/mailer");

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  next();
};

// ── Route 1: POST /api/billing/checkout ──────────────────────────────────────

const checkoutRules = [
  body("customerEmail").isEmail().withMessage("Valid customer email is required"),
  body("customerName").optional().isString(),
  body("items").isArray({ min: 1 }).withMessage("items must be a non-empty array"),
  body("items.*.inventoryId").isInt({ min: 1 }).withMessage("Each item must have a valid inventoryId"),
  body("items.*.quantity").isInt({ min: 1 }).withMessage("Each item quantity must be a positive integer"),
];

router.post("/checkout", checkoutRules, validate, async (req, res) => {
  try {
    const bill = await processCheckout(req.body);
    res.status(201).json({ success: true, data: bill });
  } catch (err) {
    const status = err.status === 400 ? 400 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
});

// ── Route 2: GET /api/billing/bills ──────────────────────────────────────────

router.get("/bills", async (req, res) => {
  try {
    const page      = Math.max(1, parseInt(req.query.page)  || 1);
    const limit     = Math.min(100, parseInt(req.query.limit) || 20);
    const { search, startDate, endDate } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { customerEmail: { contains: search, mode: "insensitive" } },
        { billNumber:    { contains: search, mode: "insensitive" } },
      ];
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate)   where.createdAt.lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bill.count({ where }),
    ]);

    res.json({ success: true, data: bills, total, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Route 3: GET /api/billing/bills/:id ──────────────────────────────────────

router.get("/bills/:id", async (req, res) => {
  try {
    const bill = await prisma.bill.findUnique({
      where: { id: Number(req.params.id) },
      include: { items: true },
    });
    if (!bill) return res.status(404).json({ success: false, error: "Bill not found" });
    res.json({ success: true, data: bill });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Route 4: GET /api/billing/bills/:id/resend-email ─────────────────────────

router.get("/bills/:id/resend-email", async (req, res) => {
  try {
    const bill = await prisma.bill.findUnique({
      where: { id: Number(req.params.id) },
      include: { items: true },
    });
    if (!bill) return res.status(404).json({ success: false, error: "Bill not found" });
    await sendBillEmail(bill, bill.items, bill.customerEmail);
    res.json({ success: true, message: "Email resent" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Route 5b: GET /api/billing/daily-sales?days=7 ───────────────────────────

router.get("/daily-sales", async (req, res) => {
  try {
    const days  = Math.min(90, Math.max(1, parseInt(req.query.days) || 7));
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const rows = await prisma.$queryRaw`
      SELECT
        DATE(sale_date)::text       AS date,
        SUM(quantity_sold)::int     AS "totalSold"
      FROM daily_sales
      WHERE sale_date >= ${start}
      GROUP BY DATE(sale_date)
      ORDER BY DATE(sale_date)
    `;

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Route 5: GET /api/billing/summary ────────────────────────────────────────

router.get("/summary", async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [bills, itemAgg] = await Promise.all([
      prisma.bill.findMany({
        where: { createdAt: { gte: todayStart, lte: todayEnd }, status: "paid" },
        include: { items: true },
      }),
      prisma.billItem.groupBy({
        by: ["itemName"],
        where: { bill: { createdAt: { gte: todayStart, lte: todayEnd }, status: "paid" } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 1,
      }),
    ]);

    const totalRevenue   = bills.reduce((s, b) => s + Number(b.total), 0);
    const totalItemsSold = bills.reduce((s, b) => s + b.items.reduce((si, i) => si + i.quantity, 0), 0);

    res.json({
      success: true,
      data: {
        totalBills:     bills.length,
        totalRevenue,
        totalItemsSold,
        mostSoldItem:   itemAgg[0]?.itemName || null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
