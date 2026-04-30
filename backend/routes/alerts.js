const express = require("express");
const router = express.Router();
const db = require("../db");
const nodemailer = require("nodemailer");
const cron = require("node-cron");

const getTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });

const buildEmailHtml = (item) => `
<h2>Reorder Request: ${item.item_name}</h2>
<p>Dear ${item.vendor_name},</p>
<p>Our stock for <strong>${item.item_name}</strong> has fallen to <strong>${item.quantity} units</strong>,
which is at or below our minimum threshold of ${item.min_quantity} units.</p>
<table border="1" cellpadding="6" style="border-collapse:collapse">
  <tr><td>Current Stock</td><td>${item.quantity}</td></tr>
  <tr><td>Minimum Stock</td><td>${item.min_quantity}</td></tr>
  <tr><td>Suggested Reorder Qty</td><td>${Math.max(0, item.min_quantity * 2 - item.quantity)}</td></tr>
  <tr><td>Warehouse Location</td><td>${item.warehouse_location || "N/A"}</td></tr>
</table>
<p>Please process this order at your earliest convenience.</p>
<p>Regards,<br/>Warehouse Management System</p>
`;

const sendVendorEmails = async () => {
  const lowStock = await db.getLowStock();
  const itemsWithEmail = lowStock.filter((i) => i.vendor_email);
  if (!itemsWithEmail.length) return { sent: 0, total: 0 };

  const transporter = getTransporter();
  const results = await Promise.allSettled(
    itemsWithEmail.map((item) =>
      transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: item.vendor_email,
        subject: `Reorder Request: ${item.item_name}`,
        html: buildEmailHtml(item),
      })
    )
  );

  // Create alerts in DB for each low-stock item
  await Promise.all(
    itemsWithEmail.map((item) =>
      db.createAlert({
        inventoryId: item.id,
        alertType: "low_stock",
        message: `Stock for ${item.item_name} is at ${item.quantity} units (min: ${item.min_quantity})`,
      })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return { sent, total: itemsWithEmail.length };
};

// Daily cron at 9am
cron.schedule("0 9 * * *", async () => {
  console.log("⏰ Running daily vendor email check...");
  const result = await sendVendorEmails();
  console.log(`📧 Sent ${result.sent}/${result.total} vendor emails`);
});

router.get("/", async (req, res) => {
  try {
    const data = await db.getUnresolvedAlerts();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/resolve/:id", async (req, res) => {
  try {
    await db.resolveAlert(Number(req.params.id));
    res.json({ success: true, message: "Alert resolved" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/send-vendor-email", async (req, res) => {
  try {
    const result = await sendVendorEmails();
    res.json({ success: true, message: `Sent ${result.sent} emails`, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
