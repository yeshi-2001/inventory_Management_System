require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const { authenticate, requireRole } = require("./middleware/auth");

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());

// ─── PUBLIC routes (no token needed) ─────────────────────────────────────────
app.use("/api/auth", require("./routes/authRoutes"));

// ─── PROTECTED routes ─────────────────────────────────────────────────────────
app.use("/api/inventory",    authenticate, requireRole("admin"),             require("./routes/inventory"));
app.use("/api/transactions", authenticate, requireRole("admin"),             require("./routes/transactions"));
app.use("/api/alerts",       authenticate, requireRole("admin"),             require("./routes/alerts"));
app.use("/api/reports",      authenticate, requireRole("admin"),             require("./routes/reports"));
app.use("/api/vendors",      authenticate, requireRole("admin"),             require("./routes/vendors"));
app.use("/api/analytics",    authenticate, requireRole("admin"),             require("./routes/analyticsRoutes"));
app.use("/api/billing",      authenticate, requireRole("admin", "employee"), require("./routes/billingRoutes"));
app.use("/api/vendor",       require("./routes/vendorPortalRoutes"));
app.use("/api/admin/users",  require("./routes/adminUserRoutes"));

app.get("/health", (_, res) => res.json({ status: "ok", db: "postgresql" }));
app.use((req, res) => res.status(404).json({ success: false, error: "Route not found" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

module.exports = app;
