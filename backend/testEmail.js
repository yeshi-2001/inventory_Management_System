/**
 * Run this file standalone to test emails via Ethereal (no real emails sent):
 *   node testEmail.js
 *
 * Ethereal is a fake SMTP service — it captures emails and shows them at
 * the URL printed in the console. No Gmail App Password needed for testing.
 */
const nodemailer = require("nodemailer");

async function testWithEthereal() {
  // Creates a one-time Ethereal test account automatically
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });

  const info = await transporter.sendMail({
    from: '"WMS System" <wms@example.com>',
    to: "vendor@example.com",
    subject: "Reorder Request: USB-C Cable",
    html: `
      <h2>Reorder Request: USB-C Cable</h2>
      <p>Dear TechSupply Co.,</p>
      <p>Current stock: <strong>25 units</strong> (minimum: 30 units)</p>
      <p>Suggested reorder quantity: <strong>35 units</strong></p>
      <p>Regards,<br/>Warehouse Management System</p>
    `,
  });

  console.log("✅ Test email sent!");
  console.log("📬 Preview URL:", nodemailer.getTestMessageUrl(info));
  // Open the printed URL in your browser to see the email
}

testWithEthereal().catch(console.error);
