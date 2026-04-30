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

module.exports = { sendEmail };
