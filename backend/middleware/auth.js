const { verifyToken } = require("../utils/jwt");

// ─── Middleware 1: authenticate ───────────────────────────────────────────────
const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer "))
    return res.status(401).json({ success: false, error: "No token provided" });

  const token = header.split(" ")[1];
  try {
    req.user = verifyToken(token); // { id, email, role, name }
    next();
  } catch {
    res.status(401).json({ success: false, error: "Token expired or invalid" });
  }
};

// ─── Middleware 2: requireRole(...roles) ──────────────────────────────────────
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role))
    return res.status(403).json({ success: false, error: "Access denied. Insufficient permissions." });
  next();
};

// ─── Middleware 3: requireVendorOrAdmin ───────────────────────────────────────
const requireVendorOrAdmin = (req, res, next) => {
  if (!req.user || !["vendor", "admin"].includes(req.user.role))
    return res.status(403).json({ success: false, error: "Access denied. Insufficient permissions." });
  req.isAdmin = req.user.role === "admin";
  next();
};

module.exports = { authenticate, requireRole, requireVendorOrAdmin };
