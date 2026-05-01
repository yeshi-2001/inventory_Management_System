const express  = require("express");
const bcrypt   = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const { prisma } = require("../db");
const { generateToken } = require("../utils/jwt");
const { authenticate } = require("../middleware/auth");
const { sendEmail } = require("../utils/mailer");

const router = express.Router();

// ─── Rate limiter: 5 failed attempts per IP per 15 min ───────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { success: false, error: "Too many login attempts. Try again later." },
});

// ─── Password policy ──────────────────────────────────────────────────────────
const isStrongPassword = (p) => p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p);

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role)
      return res.status(400).json({ success: false, error: "email, password and role are required" });

    let subject, tokenPayload;

    if (role === "admin" || role === "employee") {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(401).json({ success: false, error: "Invalid email or password" });
      if (!user.isActive) return res.status(403).json({ success: false, error: "Your account has been deactivated. Contact admin." });
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) return res.status(401).json({ success: false, error: "Invalid email or password" });
      if (user.role !== role) return res.status(403).json({ success: false, error: "Access denied for this role" });

      await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

      tokenPayload = { id: user.id, email: user.email, role: user.role, name: user.fullName };
      subject = { id: user.id, name: user.fullName, email: user.email, role: user.role };

    } else if (role === "vendor") {
      const vendor = await prisma.vendorAccount.findUnique({ where: { email } });
      if (!vendor) return res.status(401).json({ success: false, error: "Invalid email or password" });
      const match = await bcrypt.compare(password, vendor.passwordHash);
      if (!match) return res.status(401).json({ success: false, error: "Invalid email or password" });
      if (!vendor.isActive) return res.status(403).json({ success: false, error: "Your account is pending admin approval." });

      tokenPayload = { id: vendor.id, email: vendor.email, role: "vendor", name: vendor.companyName };
      subject = { id: vendor.id, name: vendor.companyName, email: vendor.email, role: "vendor" };

    } else {
      return res.status(400).json({ success: false, error: "role must be admin, employee, or vendor" });
    }

    const token = generateToken(tokenPayload);
    res.json({ success: true, token, user: subject });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/auth/register-vendor ──────────────────────────────────────────
router.post("/register-vendor", async (req, res) => {
  try {
    const { companyName, contactName, email, password, phone } = req.body;
    if (!companyName || !contactName || !email || !password)
      return res.status(400).json({ success: false, error: "companyName, contactName, email and password are required" });

    if (!isStrongPassword(password))
      return res.status(400).json({ success: false, error: "Password must be at least 8 characters with one uppercase letter and one number" });

    const existing = await prisma.vendorAccount.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ success: false, error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.vendorAccount.create({
      data: { companyName, contactName, email, passwordHash, phone, isActive: false },
    });

    // Email to vendor
    await sendEmail(email, "Registration Received — Inventory Management System", `
      <p>Dear <strong>${contactName}</strong>,</p>
      <p>Your vendor registration for <strong>${companyName}</strong> has been received.</p>
      <p>Admin will review and approve your account. You will be notified by email once approved.</p>
      <p>Regards,<br/>Inventory Management System</p>
    `).catch(() => {});

    // Email to owner
    await sendEmail(process.env.OWNER_EMAIL, `New Vendor Registration: ${companyName}`, `
      <p>A new vendor has registered and is awaiting approval:</p>
      <ul>
        <li><strong>Company:</strong> ${companyName}</li>
        <li><strong>Contact:</strong> ${contactName}</li>
        <li><strong>Email:</strong> ${email}</li>
      </ul>
      <p>Please review in the admin panel.</p>
    `).catch(() => {});

    res.status(201).json({ success: true, message: "Registration submitted. You will be notified once approved." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/auth/logout (protected — placeholder) ─────────────────────────
router.post("/logout", authenticate, (req, res) => {
  res.json({ success: true, message: "Logged out" });
});

// ─── GET /api/auth/me (protected) ────────────────────────────────────────────
router.get("/me", authenticate, async (req, res) => {
  try {
    const { id, role } = req.user;
    if (role === "vendor") {
      const vendor = await prisma.vendorAccount.findUnique({
        where: { id },
        select: { id: true, companyName: true, contactName: true, email: true, phone: true, isActive: true },
      });
      return res.json({ success: true, user: { ...vendor, role: "vendor", name: vendor.companyName } });
    }
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, fullName: true, email: true, role: true, isActive: true, lastLogin: true },
    });
    res.json({ success: true, user: { ...user, name: user.fullName } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/auth/change-password (protected) ──────────────────────────────
router.post("/change-password", authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, error: "currentPassword and newPassword are required" });

    if (!isStrongPassword(newPassword))
      return res.status(400).json({ success: false, error: "New password must be at least 8 characters with one uppercase letter and one number" });

    const { id, role } = req.user;
    const table = role === "vendor" ? prisma.vendorAccount : prisma.user;

    const record = await table.findUnique({ where: { id } });
    const match  = await bcrypt.compare(currentPassword, record.passwordHash);
    if (!match) return res.status(401).json({ success: false, error: "Current password is incorrect" });

    const newHash = await bcrypt.hash(newPassword, 12);
    await table.update({ where: { id }, data: { passwordHash: newHash } });

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
