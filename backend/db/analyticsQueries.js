const { prisma } = require("../db");
const { Prisma } = require("@prisma/client");

// ─── Input sanitization ───────────────────────────────────────────────────────

const sanitizeDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end   = new Date(endDate);

  if (isNaN(start.getTime())) throw new Error("Invalid startDate");
  if (isNaN(end.getTime()))   throw new Error("Invalid endDate");
  if (end < start)            throw new Error("endDate must be >= startDate");

  const diffDays = (end - start) / 86400000;
  if (diffDays > 365)         throw new Error("Date range cannot exceed 365 days");

  return { start, end };
};

// ─── QUERY 1 — Sales summary per item for a date range ───────────────────────

const getSalesSummary = async (start, end, itemId = null) => {
  // start/end are already Date objects coming from resolveDateRange
  const s = start instanceof Date ? start : new Date(start);
  const e = end   instanceof Date ? end   : new Date(end);

  if (itemId) {
    return prisma.$queryRaw`
      SELECT
        i.id                                                            AS "inventoryId",
        i.item_name                                                     AS "itemName",
        i.quantity                                                      AS "currentQuantity",
        i.min_quantity                                                  AS "minQuantity",
        COALESCE(SUM(CASE WHEN t.type = 'OUT' THEN t.quantity END), 0)::int AS "totalSold",
        COALESCE(SUM(CASE WHEN t.type = 'IN'  THEN t.quantity END), 0)::int AS "totalReceived",
        COUNT(DISTINCT CASE WHEN t.type = 'OUT' THEN DATE(t.created_at) END)::int AS "salesDays",
        v.lead_time_days                                                AS "vendorLeadTimeDays"
      FROM inventory i
      LEFT JOIN transactions t
        ON t.inventory_id = i.id
        AND t.created_at >= ${s}
        AND t.created_at <= ${e}
      LEFT JOIN vendors v ON v.id = i.vendor_id
      WHERE i.id = ${Number(itemId)}
      GROUP BY i.id, i.item_name, i.quantity, i.min_quantity, v.lead_time_days
      ORDER BY i.item_name
    `;
  }

  return prisma.$queryRaw`
    SELECT
      i.id                                                            AS "inventoryId",
      i.item_name                                                     AS "itemName",
      i.quantity                                                      AS "currentQuantity",
      i.min_quantity                                                  AS "minQuantity",
      COALESCE(SUM(CASE WHEN t.type = 'OUT' THEN t.quantity END), 0)::int AS "totalSold",
      COALESCE(SUM(CASE WHEN t.type = 'IN'  THEN t.quantity END), 0)::int AS "totalReceived",
      COUNT(DISTINCT CASE WHEN t.type = 'OUT' THEN DATE(t.created_at) END)::int AS "salesDays",
      v.lead_time_days                                                AS "vendorLeadTimeDays"
    FROM inventory i
    LEFT JOIN transactions t
      ON t.inventory_id = i.id
      AND t.created_at >= ${s}
      AND t.created_at <= ${e}
    LEFT JOIN vendors v ON v.id = i.vendor_id
    GROUP BY i.id, i.item_name, i.quantity, i.min_quantity, v.lead_time_days
    ORDER BY i.item_name
  `;
};

// ─── QUERY 2 — Daily sales breakdown per item (for chart) ────────────────────

const getDailySalesBreakdown = async (inventoryId, startDate, endDate) => {
  const { start, end } = sanitizeDateRange(startDate, endDate);
  const id = Number(inventoryId);

  return prisma.$queryRaw`
    SELECT
      gs.day::date                          AS "saleDate",
      COALESCE(SUM(t.quantity), 0)::int     AS "quantitySold"
    FROM generate_series(
      ${start}::timestamp,
      ${end}::timestamp,
      '1 day'::interval
    ) AS gs(day)
    LEFT JOIN transactions t
      ON DATE(t.created_at) = gs.day::date
      AND t.inventory_id = ${id}
      AND t.type = 'OUT'
    GROUP BY gs.day
    ORDER BY gs.day
  `;
};

// ─── QUERY 3 — Stock level over time ─────────────────────────────────────────

const getStockLevelOverTime = async (inventoryId, startDate, endDate) => {
  const { start, end } = sanitizeDateRange(startDate, endDate);
  const id = Number(inventoryId);

  return prisma.$queryRaw`
    WITH daily_delta AS (
      SELECT
        DATE(created_at)                                              AS txn_date,
        SUM(CASE WHEN type = 'IN'  THEN quantity ELSE 0 END)
        - SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END)       AS net_delta
      FROM transactions
      WHERE inventory_id = ${id}
        AND created_at >= ${start}
        AND created_at <= ${end}
      GROUP BY DATE(created_at)
    ),
    current_qty AS (
      SELECT quantity AS qty FROM inventory WHERE id = ${id}
    ),
    all_days AS (
      SELECT gs.day::date AS day
      FROM generate_series(
        ${start}::timestamp,
        ${end}::timestamp,
        '1 day'::interval
      ) gs(day)
    ),
    running AS (
      SELECT
        d.day,
        SUM(COALESCE(dd.net_delta, 0)) OVER (
          ORDER BY d.day DESC
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS cumulative_delta_from_end
      FROM all_days d
      LEFT JOIN daily_delta dd ON dd.txn_date = d.day
    )
    SELECT
      r.day                                                           AS "date",
      GREATEST(0, (cq.qty - r.cumulative_delta_from_end))::int       AS "quantity"
    FROM running r
    CROSS JOIN current_qty cq
    ORDER BY r.day
  `;
};

module.exports = { getSalesSummary, getDailySalesBreakdown, getStockLevelOverTime, sanitizeDateRange };
