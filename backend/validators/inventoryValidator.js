const { body, validationResult } = require("express-validator");
const { prisma } = require("../db");

// ─── Reusable error formatter ─────────────────────────────────────────────────
const formatErrors = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: result.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Shared field rules ───────────────────────────────────────────────────────
const baseRules = [
  body("itemName")
    .trim()
    .notEmpty().withMessage("Item name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Item name must be between 2 and 100 characters"),

  body("quantity")
    .isInt({ min: 0 }).withMessage("Quantity must be 0 or more"),

  body("minQuantity")
    .isInt({ min: 0 }).withMessage("Min quantity must be 0 or more"),

  body("unitPrice")
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage("Unit price must be a positive number")
    .custom((val) => {
      if (val !== undefined && val !== null) {
        const decimals = val.toString().split(".")[1];
        if (decimals && decimals.length > 2) throw new Error("Unit price max 2 decimal places");
      }
      return true;
    }),

  body("vendorId")
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage("Vendor ID must be a positive integer")
    .custom(async (val) => {
      if (!val) return true;
      const vendor = await prisma.vendor.findUnique({ where: { id: Number(val) } });
      if (!vendor) throw new Error("Vendor not found");
      return true;
    }),
];

// ─── Cross-field warning injector (non-blocking) ──────────────────────────────
const injectLowStockWarning = (req, res, next) => {
  const qty = Number(req.body.quantity);
  const minQty = Number(req.body.minQuantity);
  if (!isNaN(qty) && !isNaN(minQty) && qty < minQty) {
    req.lowStockWarning = "Quantity is below minimum threshold. A low-stock alert will be triggered.";
  }
  next();
};

// ─── Exported middleware chains ───────────────────────────────────────────────
const validateCreateInventory = [...baseRules, formatErrors, injectLowStockWarning];
const validateUpdateInventory  = [...baseRules, formatErrors, injectLowStockWarning];

module.exports = { validateCreateInventory, validateUpdateInventory };
