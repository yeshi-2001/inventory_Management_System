const express = require("express");
const bcrypt  = require("bcryptjs");
const { prisma } = require("../db");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate, requireRole("admin"));

// ─── Audit log helper ─────────────────────────────────────────────────────────
const audit = (action, performedBy, targetId, details) =>
  prisma.auditLog.create({ data: { action, performedBy, targetId, details } }).catch(() => {});

const USER_SELECT = { id: true, fullName: true, email: true, role: true, isActive: true, createdAt: true, lastLogin: true };

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const users = await prisma.user.findMany({ select: USER_SELECT, orderBy: { createdAt: "desc" } });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/admin/users ────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    if (!fullName || !email || !password || !["admin", "employee"].includes(role))
      return res.status(400).json({ success: false, error: "fullName, email, password and role (admin|employee) are required" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ success: false, error: "Email already exists" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { fullName, email, passwordHash, role },
      select: USER_SELECT,
    });
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PUT /api/admin/users/:id ─────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { fullName, role, isActive } = req.body;

    const before = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    const user = await prisma.user.update({
      where: { id },
      data: { fullName, role, isActive },
      select: USER_SELECT,
    });

    if (before && role && before.role !== role)
      await audit("USER_ROLE_CHANGED", req.user.id, id, `Role changed from ${before.role} to ${role}`);

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── DELETE /api/admin/users/:id ──────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (id === req.user.id) return res.status(400).json({ success: false, error: "You cannot delete your own account" });
    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/admin/vendors ───────────────────────────────────────────────────
router.get("/vendors", async (req, res) => {
  try {
    const vendors = await prisma.vendorAccount.findMany({
      select: { id: true, companyName: true, contactName: true, email: true, phone: true, isActive: true, createdAt: true, approvedAt: true, approvedBy: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: vendors });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PUT /api/admin/vendors/:id/approve ──────────────────────────────────────
router.put("/vendors/:id/approve", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const vendor = await prisma.vendorAccount.update({
      where: { id },
      data: { isActive: true, approvedById: req.user.id, approvedAt: new Date() },
      select: { id: true, companyName: true, email: true, isActive: true },
    });
    await audit("VENDOR_APPROVED", req.user.id, id, `Vendor "${vendor.companyName}" approved`);

    await require("../utils/mailer").sendEmail(vendor.email, "Your vendor account has been approved", `
      <p>Your vendor account for <strong>${vendor.companyName}</strong> has been approved.</p>
      <p>You can now log in to the vendor portal.</p>
    `).catch(() => {});

    res.json({ success: true, data: vendor });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PUT /api/admin/vendors/:id/deactivate ────────────────────────────────────
router.put("/vendors/:id/deactivate", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const vendor = await prisma.vendorAccount.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, companyName: true, isActive: true },
    });
    await audit("VENDOR_DEACTIVATED", req.user.id, id, `Vendor "${vendor.companyName}" deactivated`);
    res.json({ success: true, data: vendor });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
