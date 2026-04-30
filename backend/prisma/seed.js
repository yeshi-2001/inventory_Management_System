const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const makeSales = (min, max, days = 30) =>
  Array.from({ length: days }, (_, i) => ({
    saleDate: new Date(Date.now() - (days - i) * 86400000),
    quantitySold: randInt(min, max),
  }));

async function main() {
  await prisma.dailySale.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.vendor.deleteMany();

  const v1 = await prisma.vendor.create({
    data: { name: "TechSupply Co.", email: "vendor1@example.com", phone: "+1-555-0101", leadTimeDays: 5 },
  });
  const v2 = await prisma.vendor.create({
    data: { name: "GlobalParts Ltd.", email: "vendor2@example.com", phone: "+1-555-0202", leadTimeDays: 7 },
  });

  const items = [
    // Normal stock
    { itemName: "USB-C Cable",          category: "Electronics", quantity: 120, minQuantity: 30,  unitPrice: 9.99,  warehouseLocation: "A1-Shelf3", vendorId: v1.id, sales: makeSales(5, 15) },
    // Low stock (quantity <= minQuantity)
    { itemName: "Wireless Mouse",       category: "Electronics", quantity: 18,  minQuantity: 20,  unitPrice: 24.99, warehouseLocation: "A2-Shelf1", vendorId: v1.id, sales: makeSales(2, 8)  },
    // Low stock
    { itemName: "Bubble Wrap Roll",     category: "Packaging",   quantity: 10,  minQuantity: 15,  unitPrice: 14.50, warehouseLocation: "B3-Shelf2", vendorId: v2.id, sales: makeSales(0, 1)  },
    // Normal stock
    { itemName: "Cardboard Box (Large)",category: "Packaging",   quantity: 200, minQuantity: 50,  unitPrice: 2.00,  warehouseLocation: "B1-Shelf1", vendorId: v2.id, sales: makeSales(10, 25)},
    // Dead stock (zero sales, low quantity)
    { itemName: "Safety Gloves (Pack)", category: "Safety",      quantity: 8,   minQuantity: 10,  unitPrice: 7.75,  warehouseLocation: "C2-Shelf4", vendorId: v2.id,
      sales: Array.from({ length: 30 }, (_, i) => ({
        saleDate: new Date(Date.now() - (30 - i) * 86400000),
        quantitySold: 0,
      })),
    },
  ];

  for (const { sales, ...item } of items) {
    await prisma.inventory.create({
      data: { ...item, dailySales: { create: sales } },
    });
  }

  console.log("✅ Seed complete: 2 vendors, 5 items (mix of normal/low/dead stock), 30 days sales each.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
