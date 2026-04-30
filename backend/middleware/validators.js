const { body, validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  next();
};

const inventoryRules = [
  body("itemName").notEmpty().withMessage("itemName is required"),
  body("quantity").isInt({ min: 0 }).withMessage("quantity must be a non-negative integer"),
  body("minQuantity").isInt({ min: 0 }).withMessage("minQuantity must be a non-negative integer"),
  body("unitPrice").optional().isFloat({ min: 0 }).withMessage("unitPrice must be a positive number"),
  body("vendorId").optional().isInt({ min: 1 }).withMessage("vendorId must be a positive integer"),
];

const transactionRules = [
  body("inventoryId").isInt({ min: 1 }).withMessage("inventoryId is required"),
  body("type").isIn(["IN", "OUT"]).withMessage("type must be IN or OUT"),
  body("quantity").isInt({ min: 1 }).withMessage("quantity must be a positive integer"),
];

module.exports = { validate, inventoryRules, transactionRules };
