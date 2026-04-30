const { prisma } = require("../db");
const { sendEmail } = require("../utils/mailer");

// ─── Email templates ──────────────────────────────────────────────────────────

const ownerEmailHtml = (item) => `
<div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
  <div style="background:#dc2626;padding:20px 24px">
    <h2 style="color:white;margin:0">⚠️ Low Stock Alert</h2>
  </div>
  <div style="padding:24px">
    <p style="margin:0 0 16px">The following item has fallen below its minimum stock threshold:</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr style="background:#f9fafb"><td style="padding:10px;border:1px solid #e5e7eb;font-weight:600">Item</td><td style="padding:10px;border:1px solid #e5e7eb">${item.itemName}</td></tr>
      <tr><td style="padding:10px;border:1px solid #e5e7eb;font-weight:600">Category</td><td style="padding:10px;border:1px solid #e5e7eb">${item.category || "—"}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:10px;border:1px solid #e5e7eb;font-weight:600">Current Stock</td><td style="padding:10px;border:1px solid #e5e7eb;color:#dc2626"><strong>${item.quantity} units</strong></td></tr>
      <tr><td style="padding:10px;border:1px solid #e5e7eb;font-weight:600">Minimum Threshold</td><td style="padding:10px;border:1px solid #e5e7eb">${item.minQuantity} units</td></tr>
      <tr style="background:#f9fafb"><td style="padding:10px;border:1px solid #e5e7eb;font-weight:600">Suggested Reorder</td><td style="padding:10px;border:1px solid #e5e7eb">${Math.max(0, item.minQuantity * 2 - item.quantity)} units</td></tr>
      <tr><td style="padding:10px;border:1px solid #e5e7eb;font-weight:600">Location</td><td style="padding:10px;border:1px solid #e5e7eb">${item.warehouseLocation || "—"}</td></tr>
      ${item.vendor ? `<tr style="background:#f9fafb"><td style="padding:10px;border:1px solid #e5e7eb;font-weight:600">Vendor</td><td style="padding:10px;border:1px solid #e5e7eb">${item.vendor.name}</td></tr>` : ""}
    </table>
    <p style="margin:20px 0 0;font-size:13px;color:#6b7280">This is an automated alert from your Warehouse Management System.</p>
  </div>
</div>`;

const vendorEmailHtml = (item) => {
  const reorderQty = Math.max(0, item.minQuantity * 2 - item.quantity);
  return `
<div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
  <div style="background:#1d4ed8;padding:20px 24px">
    <h2 style="color:white;margin:0">📦 Reorder Request</h2>
  </div>
  <div style="padding:24px">
    <p>Dear <strong>${item.vendor.name}</strong>,</p>
    <p>We would like to place a reorder for the following item. Our stock has fallen below the minimum threshold and requires immediate replenishment.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr style="background:#f9fafb"><td style="padding:10px;border:1px solid #e5e7eb;font-weight:600">Item Name</td><td style="padding:10px;border:1px solid #e5e7eb">${item.itemName}</td></tr>
      <tr><td style="padding:10px;border:1px solid #e5e7eb;font-weight:600">Current Stock</td><td style="padding:10px;border:1px solid #e5e7eb;color:#dc2626"><strong>${item.quantity} units</strong></td></tr>
      <tr style="background:#f9fafb"><td style="padding:10px;border:1px solid #e5e7eb;font-weight:600">Minimum Required</td><td style="padding:10px;border:1px solid #e5e7eb">${item.minQuantity} units</td></tr>
      <tr><td style="padding:10px;border:1px solid #e5e7eb;font-weight:600;background:#fef9c3">Requested Quantity</td><td style="padding:10px;border:1px solid #e5e7eb;background:#fef9c3"><strong>${reorderQty} units</strong></td></tr>
      <tr style="background:#f9fafb"><td style="padding:10px;border:1px solid #e5e7eb;font-weight:600">Delivery Location</td><td style="padding:10px;border:1px solid #e5e7eb">${item.warehouseLocation || "Main Warehouse"}</td></tr>
    </table>
    <p style="margin:20px 0 8px">Please confirm this order at your earliest convenience.</p>
    <p style="margin:0;font-size:13px;color:#6b7280">Regards,<br/><strong>Warehouse Management System</strong></p>
  </div>
</div>`;
};

// ─── Core service function ────────────────────────────────────────────────────

const checkAndTriggerAlert = async (inventoryId) => {
  const item = await prisma.inventory.findUnique({
    where: { id: inventoryId },
    include: { vendor: true },
  });
  if (!item) return;

  if (item.quantity <= item.minQuantity) {
    // Check for existing unresolved low_stock alert — avoid duplicates
    const existing = await prisma.alert.findFirst({
      where: { inventoryId, alertType: "low_stock", resolved: false },
    });

    if (!existing) {
      await prisma.alert.create({
        data: {
          inventoryId,
          alertType: "low_stock",
          message: `${item.itemName} is at ${item.quantity} units (min: ${item.minQuantity})`,
        },
      });

      // Email store owner
      if (process.env.OWNER_EMAIL) {
        await sendEmail(
          process.env.OWNER_EMAIL,
          `Low Stock Alert: ${item.itemName}`,
          ownerEmailHtml(item)
        );
      }

      // Email vendor if linked
      if (item.vendor?.email) {
        await sendEmail(
          item.vendor.email,
          `Reorder Request: ${item.itemName}`,
          vendorEmailHtml(item)
        );
      }
    }
  } else {
    // Quantity is back above threshold — auto-resolve any open alert
    await prisma.alert.updateMany({
      where: { inventoryId, alertType: "low_stock", resolved: false },
      data: { resolved: true },
    });
  }
};

module.exports = { checkAndTriggerAlert };
