const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ─── Inventory ────────────────────────────────────────────────────────────────

const getAllInventory = () =>
  prisma.inventory.findMany({ include: { vendor: true } });

const getInventoryById = (id) =>
  prisma.inventory.findUnique({ where: { id }, include: { vendor: true } });

const createInventory = (data) =>
  prisma.inventory.create({ data, include: { vendor: true } });

const updateInventory = (id, data) =>
  prisma.inventory.update({ where: { id }, data, include: { vendor: true } });

const deleteInventory = (id) =>
  prisma.inventory.delete({ where: { id } });

const getLowStock = () =>
  prisma.$queryRaw`
    SELECT i.*, v.name AS vendor_name, v.email AS vendor_email
    FROM inventory i
    LEFT JOIN vendors v ON i.vendor_id = v.id
    WHERE i.quantity <= i.min_quantity
  `;

const getDeadStock = async () => {
  const cutoff = new Date(Date.now() - 14 * 86400000);
  const items = await prisma.inventory.findMany({
    include: { dailySales: { where: { saleDate: { gte: cutoff } } } },
  });
  return items.filter((i) =>
    i.dailySales.reduce((s, d) => s + d.quantitySold, 0) === 0
  );
};

const getFastMovers = async () => {
  const items = await prisma.inventory.findMany({
    include: { dailySales: { orderBy: { saleDate: "desc" }, take: 30 } },
  });
  return items
    .map((i) => {
      const avg = i.dailySales.length
        ? i.dailySales.reduce((s, d) => s + d.quantitySold, 0) / i.dailySales.length
        : 0;
      return { ...i, avgDailySales: avg };
    })
    .sort((a, b) => b.avgDailySales - a.avgDailySales)
    .slice(0, 5);
};

// ─── Transactions ─────────────────────────────────────────────────────────────

const logTransaction = async ({ inventoryId, type, quantity, notes }) => {
  return prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: { inventoryId, type, quantity, notes },
    });
    const delta = type === "IN" ? quantity : -quantity;
    await tx.inventory.update({
      where: { id: inventoryId },
      data: { quantity: { increment: delta } },
    });
    return transaction;
  });
};

const getTransactionsByItem = (inventoryId) =>
  prisma.transaction.findMany({
    where: { inventoryId },
    orderBy: { createdAt: "desc" },
  });

// ─── Alerts ───────────────────────────────────────────────────────────────────

const getUnresolvedAlerts = () =>
  prisma.alert.findMany({
    where: { resolved: false },
    include: { inventory: true },
    orderBy: { createdAt: "desc" },
  });

const resolveAlert = (id) =>
  prisma.alert.update({ where: { id }, data: { resolved: true } });

const createAlert = (data) => prisma.alert.create({ data });

// ─── Reports ──────────────────────────────────────────────────────────────────

const getSummary = async () => {
  const cutoff = new Date(Date.now() - 14 * 86400000);
  const [rows] = await prisma.$queryRaw`
    SELECT
      COUNT(DISTINCT i.id)::int                                        AS total_items,
      COALESCE(SUM(i.quantity * i.unit_price), 0)::numeric            AS total_stock_value,
      COUNT(DISTINCT CASE WHEN i.quantity <= i.min_quantity
            THEN i.id END)::int                                        AS low_stock_count,
      COUNT(DISTINCT CASE WHEN ds_recent.total_sold = 0 OR ds_recent.total_sold IS NULL
            THEN i.id END)::int                                        AS dead_stock_count,
      (
        SELECT v.name
        FROM vendors v
        JOIN inventory inv ON inv.vendor_id = v.id
        GROUP BY v.id, v.name
        ORDER BY COUNT(inv.id) DESC
        LIMIT 1
      )                                                                AS top_vendor
    FROM inventory i
    LEFT JOIN (
      SELECT inventory_id, SUM(quantity_sold) AS total_sold
      FROM daily_sales
      WHERE sale_date >= ${cutoff}
      GROUP BY inventory_id
    ) ds_recent ON ds_recent.inventory_id = i.id
  `;
  return rows;
};

module.exports = {
  getAllInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  getLowStock,
  getDeadStock,
  getFastMovers,
  logTransaction,
  getTransactionsByItem,
  getUnresolvedAlerts,
  resolveAlert,
  createAlert,
  getSummary,
  prisma,
};
