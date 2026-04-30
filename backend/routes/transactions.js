const express = require("express");
const router = express.Router();
const db = require("../db");
const { transactionRules, validate } = require("../middleware/validators");

router.post("/", transactionRules, validate, async (req, res) => {
  try {
    const { inventoryId, type, quantity, notes } = req.body;
    const data = await db.logTransaction({
      inventoryId: Number(inventoryId),
      type,
      quantity: Number(quantity),
      notes,
    });
    res.status(201).json({ success: true, data, message: "Transaction logged" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/:inventoryId", async (req, res) => {
  try {
    const data = await db.getTransactionsByItem(Number(req.params.inventoryId));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
