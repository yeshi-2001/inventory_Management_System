const express = require("express");
const router = express.Router();
const db = require("../db");
const { validateCreateInventory, validateUpdateInventory } = require("../validators/inventoryValidator");
const { checkAndTriggerAlert } = require("../services/alertService");

router.get("/low-stock", async (req, res) => {
  try {
    const data = await db.getLowStock();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, errors: [{ field: null, message: error.message }] });
  }
});

router.get("/dead-stock", async (req, res) => {
  try {
    const data = await db.getDeadStock();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, errors: [{ field: null, message: error.message }] });
  }
});

router.get("/fast-movers", async (req, res) => {
  try {
    const data = await db.getFastMovers();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, errors: [{ field: null, message: error.message }] });
  }
});

router.get("/", async (req, res) => {
  try {
    const data = await db.getAllInventory();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, errors: [{ field: null, message: error.message }] });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const data = await db.getInventoryById(Number(req.params.id));
    if (!data) return res.status(404).json({ success: false, errors: [{ field: "id", message: "Item not found" }] });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, errors: [{ field: null, message: error.message }] });
  }
});

router.post("/", validateCreateInventory, async (req, res) => {
  try {
    const { vendorId, unitPrice, ...rest } = req.body;
    const data = await db.createInventory({
      ...rest,
      unitPrice: unitPrice != null ? Number(unitPrice) : undefined,
      vendorId: vendorId != null ? Number(vendorId) : undefined,
    });

    // Fire-and-forget — does not block the response
    checkAndTriggerAlert(data.id).catch(console.error);

    const response = { success: true, data, message: "Item created" };
    if (req.lowStockWarning) response.warning = req.lowStockWarning;
    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ success: false, errors: [{ field: null, message: error.message }] });
  }
});

router.put("/:id", validateUpdateInventory, async (req, res) => {
  try {
    const { vendorId, unitPrice, ...rest } = req.body;
    const data = await db.updateInventory(Number(req.params.id), {
      ...rest,
      unitPrice: unitPrice != null ? Number(unitPrice) : undefined,
      vendorId: vendorId != null ? Number(vendorId) : undefined,
    });

    // Only trigger alert check if quantity was part of the update
    if (req.body.quantity !== undefined) {
      checkAndTriggerAlert(data.id).catch(console.error);
    }

    const response = { success: true, data, message: "Item updated" };
    if (req.lowStockWarning) response.warning = req.lowStockWarning;
    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, errors: [{ field: null, message: error.message }] });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.deleteInventory(Number(req.params.id));
    res.json({ success: true, message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ success: false, errors: [{ field: null, message: error.message }] });
  }
});

module.exports = router;
