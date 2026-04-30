/**
 * Run: npx jest tests/analytics.test.js
 */

const request = require("supertest");

// ─── Mock axios before importing app ─────────────────────────────────────────
jest.mock("axios");
const axios = require("axios");

const MOCK_PYTHON_RESPONSE = {
  data: {
    success: true,
    data: [
      {
        inventoryId: 1, itemName: "USB-C Cable", avgDailySales: 2.0,
        daysToStockout: 15.0, safetyStock: 7, recommendedOrderQty: 0,
        stockStatus: "normal", insight: "Stock is stable.", totalSold: 60,
        currentQuantity: 120, minQuantity: 30,
      },
    ],
    skipped: [],
  },
};

const MOCK_HEALTH_OK = { data: { status: "ok" } };

const app = require("../server");

// ─── 1. stock-report with period=7 returns correct shape ─────────────────────
test("GET /api/analytics/stock-report?period=7 returns correct shape", async () => {
  axios.get.mockResolvedValueOnce(MOCK_HEALTH_OK);
  axios.post.mockResolvedValueOnce(MOCK_PYTHON_RESPONSE);

  const res = await request(app).get("/api/analytics/stock-report?period=7");

  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body).toHaveProperty("period");
  expect(res.body.period.days).toBe(7);
  expect(Array.isArray(res.body.data)).toBe(true);
});

// ─── 2. Invalid period param returns 400 ─────────────────────────────────────
test("GET /api/analytics/stock-report with invalid period returns 400", async () => {
  const res = await request(app).get("/api/analytics/stock-report?period=999");

  expect(res.status).toBe(400);
  expect(res.body.success).toBe(false);
  expect(res.body.errors[0].field).toBe("period");
});

// ─── 3. Export CSV returns correct Content-Type ───────────────────────────────
test("GET /api/analytics/export?format=csv returns text/csv", async () => {
  axios.get.mockResolvedValueOnce(MOCK_HEALTH_OK);
  axios.post.mockResolvedValueOnce(MOCK_PYTHON_RESPONSE);

  const res = await request(app).get("/api/analytics/export?period=30&format=csv");

  expect(res.status).toBe(200);
  expect(res.headers["content-type"]).toMatch(/text\/csv/);
  expect(res.headers["content-disposition"]).toMatch(/attachment/);
});

// ─── 4. Python service down → 503 ────────────────────────────────────────────
test("returns 503 when Python service is down", async () => {
  axios.get.mockRejectedValueOnce(new Error("ECONNREFUSED"));

  const res = await request(app).get("/api/analytics/stock-report?period=30");

  expect(res.status).toBe(503);
  expect(res.body.success).toBe(false);
  expect(res.body.error).toMatch(/unavailable/i);
});

// ─── 5. custom period without dates returns 400 ───────────────────────────────
test("GET /api/analytics/stock-report with period=custom and no dates returns 400", async () => {
  const res = await request(app).get("/api/analytics/stock-report?period=custom");

  expect(res.status).toBe(400);
  expect(res.body.success).toBe(false);
});
