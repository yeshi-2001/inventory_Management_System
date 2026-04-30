require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());

app.use("/api/inventory",    require("./routes/inventory"));
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/alerts",       require("./routes/alerts"));
app.use("/api/reports",      require("./routes/reports"));
app.use("/api/vendors",      require("./routes/vendors"));
app.use("/api/analytics",    require("./routes/analyticsRoutes"));

app.get("/health", (_, res) => res.json({ status: "ok", db: "postgresql" }));

app.use((req, res) => res.status(404).json({ success: false, error: "Route not found" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
