const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const sendEmail = async (to, subject, htmlBody) => {
  await transporter.sendMail({
    from: `"Warehouse Management System" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html: htmlBody,
  });
};

// ─── Bill / Invoice email ─────────────────────────────────────────────────────

const buildBillHtml = (bill, billItems) => {
  const shopName    = process.env.SHOP_NAME          || "Our Store";
  const contactEmail = process.env.SHOP_CONTACT_EMAIL || process.env.GMAIL_USER || "";
  const date        = new Date(bill.createdAt).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });

  const rowsHtml = billItems.map((item, idx) => {
    const bg = idx % 2 === 0 ? "#f9fafb" : "#ffffff";
    return `
      <tr style="background:${bg}">
        <td style="padding:10px 12px;border:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:13px">${item.itemName}</td>
        <td style="padding:10px 12px;border:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:13px;text-align:right">${item.quantity}</td>
        <td style="padding:10px 12px;border:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:13px;text-align:right">Rs. ${Number(item.unitPrice).toFixed(2)}</td>
        <td style="padding:10px 12px;border:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;font-size:13px;text-align:right">Rs. ${Number(item.subtotal).toFixed(2)}</td>
      </tr>`;
  }).join("");

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">

        <!-- Header -->
        <tr>
          <td style="background:#1e3a5f;padding:24px 32px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td><span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;color:#ffffff">${shopName}</span></td>
                <td align="right"><span style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#93c5fd">Tax Invoice / Bill</span></td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Bill meta -->
        <tr>
          <td style="padding:20px 32px;border-bottom:1px solid #e5e7eb">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:bold;color:#111827">${bill.billNumber}</span>
                </td>
                <td align="right">
                  <span style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6b7280">${date}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Customer -->
        <tr>
          <td style="padding:16px 32px;border-bottom:1px solid #e5e7eb;background:#f9fafb">
            <span style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Billed to</span><br/>
            ${bill.customerName ? `<span style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:#111827">${bill.customerName}</span><br/>` : ""}
            <span style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#374151">${bill.customerEmail}</span>
          </td>
        </tr>

        <!-- Items table -->
        <tr>
          <td style="padding:24px 32px">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
              <tr style="background:#1e3a5f">
                <th style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#ffffff;text-align:left;border:1px solid #1e3a5f">Item</th>
                <th style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#ffffff;text-align:right;border:1px solid #1e3a5f">Qty</th>
                <th style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#ffffff;text-align:right;border:1px solid #1e3a5f">Unit Price</th>
                <th style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#ffffff;text-align:right;border:1px solid #1e3a5f">Subtotal</th>
              </tr>
              ${rowsHtml}
              <tr style="background:#f0fdf4">
                <td colspan="3" style="padding:12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;text-align:right;border:1px solid #e5e7eb">Grand Total</td>
                <td style="padding:12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-align:right;color:#16a34a;border:1px solid #e5e7eb">Rs. ${Number(bill.total).toFixed(2)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e5e7eb;background:#f9fafb;text-align:center">
            <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;margin:0 0 8px">Thank you for your purchase.</p>
            <p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6b7280;margin:0 0 4px">${contactEmail}</p>
            <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9ca3af;margin:0">This is a computer-generated bill. No signature required.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

const sendBillEmail = async (bill, billItems, customerEmail) => {
  const shopName = process.env.SHOP_NAME || "Our Store";
  await transporter.sendMail({
    from: `"${shopName}" <${process.env.GMAIL_USER}>`,
    to: customerEmail,
    subject: `Your bill from ${shopName} — ${bill.billNumber}`,
    html: buildBillHtml(bill, billItems),
  });
};

module.exports = { sendEmail, sendBillEmail };
