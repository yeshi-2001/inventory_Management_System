const express = require("express");
const router = express.Router();
const { prisma } = require("../db");

router.get("/", async (req, res) => {
  try {
    const data = await prisma.vendor.findMany({ orderBy: { name: "asc" } });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const data = await prisma.vendor.findUnique({ where: { id: Number(req.params.id) } });
    if (!data) return res.status(404).json({ success: false, error: "Vendor not found" });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
