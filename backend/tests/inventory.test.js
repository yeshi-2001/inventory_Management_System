/**
 * Run with: npx jest tests/inventory.test.js
 * Requires a test database — set TEST_DATABASE_URL in .env or it falls back to DATABASE_URL
 */

const request  = require("supertest");
const { PrismaClient } = require("@prisma/client");

// ─── Mock nodemailer before any imports that use it ───────────────────────────
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: "test-id" }),
  })),
}));

const app    = require("../server");
const prisma = new PrismaClient();

// ─── Test vendor + cleanup helpers ───────────────────────────────────────────
let testVendorId;

beforeAll(async () => {
  const vendor = await prisma.vendor.create({
    data: { name: "Test Vendor", email: `testvendor_${Date.now()}@example.com` },
  });
  testVendorId = vendor.id;
});

afterAll(async () => {
  await prisma.alert.deleteMany();
  await prisma.inventory.deleteMany({ where: { itemName: { startsWith: "Test " } } });
  await prisma.vendor.delete({ where: { id: testVendorId } });
  await prisma.$disconnect();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/inventory", () => {
  // 1. Valid item creation
  test("creates item with valid data → 201 + item returned", async () => {
    const res = await request(app)
      .post("/api/inventory")
      .send({ itemName: "Test USB Hub", category: "Electronics", quantity: 50, minQuantity: 10, unitPrice: 19.99 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ quantity: 50 });
    expect(res.body.data.id).toBeDefined();
  });

  // 2. Empty itemName → 400 with field error
  test("rejects empty itemName → 400 with field error", async () => {
    const res = await request(app)
      .post("/api/inventory")
      .send({ itemName: "", quantity: 10, minQuantity: 5 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "itemName" })])
    );
  });

  // 3. Negative quantity → 400 with field error
  test("rejects quantity = -1 → 400 with field error", async () => {
    const res = await request(app)
      .post("/api/inventory")
      .send({ itemName: "Test Item", quantity: -1, minQuantity: 5 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "quantity" })])
    );
  });

  // 4. quantity < minQuantity → 201 but with warning field
  test("creates item with qty < minQty → 201 + warning field", async () => {
    const res = await request(app)
      .post("/api/inventory")
      .send({ itemName: "Test Low Item", quantity: 3, minQuantity: 20 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.warning).toBeDefined();
    expect(res.body.warning).toMatch(/low-stock alert/i);
  });
});

describe("PUT /api/inventory/:id", () => {
  let itemId;

  beforeEach(async () => {
    const item = await prisma.inventory.create({
      data: { itemName: "Test Updatable Item", quantity: 50, minQuantity: 10 },
    });
    itemId = item.id;
  });

  afterEach(async () => {
    await prisma.alert.deleteMany({ where: { inventoryId: itemId } });
    await prisma.inventory.deleteMany({ where: { id: itemId } });
  });

  // 5. Update quantity below minQuantity → checkAndTriggerAlert is called (email mock invoked)
  test("updating qty below minQty triggers checkAndTriggerAlert", async () => {
    const nodemailer = require("nodemailer");
    const sendMailMock = nodemailer.createTransport().sendMail;
    sendMailMock.mockClear();

    // Set OWNER_EMAIL so the alert service tries to send
    process.env.OWNER_EMAIL = "owner@test.com";

    const res = await request(app)
      .put(`/api/inventory/${itemId}`)
      .send({ itemName: "Test Updatable Item", quantity: 5, minQuantity: 10 });

    expect(res.status).toBe(200);
    expect(res.body.warning).toBeDefined();

    // Give the background async a moment to run
    await new Promise((r) => setTimeout(r, 200));

    const alert = await prisma.alert.findFirst({ where: { inventoryId: itemId, alertType: "low_stock" } });
    expect(alert).not.toBeNull();
  });

  // 6. Updating qty above minQty after being low → resolves existing alert
  test("updating qty above minQty resolves existing low_stock alert", async () => {
    // Create an existing unresolved alert
    await prisma.alert.create({
      data: { inventoryId: itemId, alertType: "low_stock", message: "Low stock", resolved: false },
    });

    const res = await request(app)
      .put(`/api/inventory/${itemId}`)
      .send({ itemName: "Test Updatable Item", quantity: 100, minQuantity: 10 });

    expect(res.status).toBe(200);

    await new Promise((r) => setTimeout(r, 200));

    const alert = await prisma.alert.findFirst({
      where: { inventoryId: itemId, alertType: "low_stock", resolved: false },
    });
    expect(alert).toBeNull();
  });
});
