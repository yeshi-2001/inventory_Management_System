const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/summary", async (req, res) => {
  try {
    const data = await db.getSummary();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
