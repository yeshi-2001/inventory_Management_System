const express = require("express");
const { prisma } = require("../db");
const { authenticate, requireRole, requireVendorOrAdmin } = require("../middleware/auth");
const { sendEmail } = require("../utils/mailer");

const router = express.Router();
router.use(authenticate);

// ─── Audit log helper ─────────────────────────────────────────────────────────
const audit = (action, performedBy, targetId, details) =>
  prisma.auditLog.create({ data: { action, performedBy, targetId, details } }).catch(() => {});

// ─── GET /api/vendor/profile ──────────────────────────────────────────────────
router.get("/profile", requireVendorOrAdmin, async (req, res) => {
  try {
    const id = req.isAdmin && req.query.vendorId ? Number(req.query.vendorId) : req.user.id;
    const vendor = await prisma.vendorAccount.findUnique({
      where: { id },
      select: { id: true, companyName: true, contactName: true, email: true, phone: true, isActive: true, createdAt: true, approvedAt: true },
    });
    if (!vendor) return res.status(404).json({ success: false, error: "Vendor not found" });
    res.json({ success: true, data: vendor });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PUT /api/vendor/profile ──────────────────────────────────────────────────
router.put("/profile", requireRole("vendor"), async (req, res) => {
  try {
    const { companyName, contactName, phone } = req.body;
    const data = await prisma.vendorAccount.update({
      where: { id: req.user.id },
      data: { companyName, contactName, phone },
      select: { id: true, companyName: true, contactName: true, email: true, phone: true },
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/vendor/offers ───────────────────────────────────────────────────
router.get("/offers", requireVendorOrAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;
    if (!req.isAdmin) where.vendorAccountId = req.user.id;

    const offers = await prisma.vendorStockOffer.findMany({
      where,
      include: { vendorAccount: { select: { companyName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: offers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/vendor/offers ──────────────────────────────────────────────────
router.post("/offers", requireRole("vendor"), async (req, res) => {
  try {
    const { itemName, category, unitPrice, minOrderQty, leadTimeDays, notes } = req.body;
    if (!itemName?.trim()) return res.status(400).json({ success: false, error: "itemName is required" });
    if (!unitPrice || Number(unitPrice) <= 0) return res.status(400).json({ success: false, error: "unitPrice must be a positive number" });
    if (!minOrderQty || Number(minOrderQty) < 1) return res.status(400).json({ success: false, error: "minOrderQty must be a positive integer" });
    if (!leadTimeDays || Number(leadTimeDays) < 1 || Number(leadTimeDays) > 365) return res.status(400).json({ success: false, error: "leadTimeDays must be between 1 and 365" });

    const offer = await prisma.vendorStockOffer.create({
      data: {
        vendorAccountId: req.user.id,
        itemName: itemName.trim(),
        category,
        unitPrice: Number(unitPrice),
        minOrderQty: Number(minOrderQty),
        leadTimeDays: Number(leadTimeDays),
        notes,
        status: "pending",
      },
    });

    await sendEmail(process.env.OWNER_EMAIL, `New Stock Offer: ${itemName}`, `
      <p>New stock offer from <strong>${req.user.name}</strong> for <strong>${itemName}</strong>.</p>
      <ul>
        <li>Unit Price: Rs. ${Number(unitPrice).toFixed(2)}</li>
        <li>Min Order Qty: ${minOrderQty}</li>
        <li>Lead Time: ${leadTimeDays} days</li>
      </ul>
      <p>Please review in the admin panel.</p>
    `).catch(() => {});

    res.status(201).json({ success: true, data: offer });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PUT /api/vendor/offers/:id ───────────────────────────────────────────────
router.put("/offers/:id", requireRole("vendor"), async (req, res) => {
  try {
    const offer = await prisma.vendorStockOffer.findUnique({ where: { id: Number(req.params.id) } });
    if (!offer) return res.status(404).json({ success: false, error: "Offer not found" });
    if (offer.vendorAccountId !== req.user.id) return res.status(403).json({ success: false, error: "Access denied" });
    if (offer.status !== "pending") return res.status(400).json({ success: false, error: "This offer has already been reviewed and cannot be edited." });

    const { itemName, category, unitPrice, minOrderQty, leadTimeDays, notes } = req.body;
    const updated = await prisma.vendorStockOffer.update({
      where: { id: offer.id },
      data: { itemName, category, unitPrice: Number(unitPrice), minOrderQty: Number(minOrderQty), leadTimeDays: Number(leadTimeDays), notes },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── DELETE /api/vendor/offers/:id ───────────────────────────────────────────
router.delete("/offers/:id", requireRole("vendor"), async (req, res) => {
  try {
    const offer = await prisma.vendorStockOffer.findUnique({ where: { id: Number(req.params.id) } });
    if (!offer) return res.status(404).json({ success: false, error: "Offer not found" });
    if (offer.vendorAccountId !== req.user.id) return res.status(403).json({ success: false, error: "Access denied" });
    if (offer.status !== "pending") return res.status(400).json({ success: false, error: "Only pending offers can be deleted." });

    await prisma.vendorStockOffer.delete({ where: { id: offer.id } });
    res.json({ success: true, message: "Offer deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PUT /api/vendor/offers/:id/review (admin only) ──────────────────────────
router.put("/offers/:id/review", requireRole("admin"), async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    if (!["accepted", "rejected"].includes(status))
      return res.status(400).json({ success: false, error: "status must be accepted or rejected" });

    const offer = await prisma.vendorStockOffer.findUnique({
      where: { id: Number(req.params.id) },
      include: { vendorAccount: true },
    });
    if (!offer) return res.status(404).json({ success: false, error: "Offer not found" });

    const updated = await prisma.vendorStockOffer.update({
      where: { id: offer.id },
      data: { status, adminNotes, reviewedById: req.user.id, reviewedAt: new Date() },
    });

    // If accepted: upsert into vendors table
    if (status === "accepted") {
      await prisma.vendor.upsert({
        where: { email: offer.vendorAccount.email },
        update: { name: offer.vendorAccount.companyName, leadTimeDays: offer.leadTimeDays },
        create: {
          name: offer.vendorAccount.companyName,
          email: offer.vendorAccount.email,
          phone: offer.vendorAccount.phone,
          leadTimeDays: offer.leadTimeDays,
        },
      });
    }

    // Audit log
    await audit(`OFFER_${status.toUpperCase()}`, req.user.id, offer.id,
      `Offer for "${offer.itemName}" ${status}. Notes: ${adminNotes || "none"}`);

    // Email vendor
    await sendEmail(offer.vendorAccount.email, `Your Stock Offer has been ${status}: ${offer.itemName}`, `
      <p>Dear <strong>${offer.vendorAccount.contactName}</strong>,</p>
      <p>Your stock offer for <strong>${offer.itemName}</strong> has been <strong>${status}</strong>.</p>
      ${adminNotes ? `<p>Admin notes: ${adminNotes}</p>` : ""}
      <p>Regards,<br/>Inventory Management System</p>
    `).catch(() => {});

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
