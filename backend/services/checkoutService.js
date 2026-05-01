const { prisma } = require("../db");
const { checkAndTriggerAlert } = require("./alertService");
const { sendBillEmail } = require("../utils/mailer");

const processCheckout = async ({ customerEmail, customerName, items }) => {
  const result = await prisma.$transaction(async (tx) => {
    // Step 1 — Validate & fetch server-side prices
    const inventoryRecords = await Promise.all(
      items.map(({ inventoryId }) =>
        tx.inventory.findUnique({ where: { id: inventoryId } })
      )
    );

    for (let i = 0; i < items.length; i++) {
      const record = inventoryRecords[i];
      const { inventoryId, quantity } = items[i];

      if (!record)
        throw Object.assign(new Error(`Item with ID ${inventoryId} not found`), { status: 400 });

      if (quantity > record.quantity)
        throw Object.assign(
          new Error(`Not enough stock for ${record.itemName}. Available: ${record.quantity}, Requested: ${quantity}`),
          { status: 400 }
        );

      if (!record.unitPrice || Number(record.unitPrice) === 0)
        throw Object.assign(
          new Error(`Item "${record.itemName}" has no price set. Cannot process sale.`),
          { status: 400 }
        );
    }

    // Step 2 — Generate bill number & create Bill + BillItems
    const billCount = await tx.bill.count();
    const billNumber = `BILL-${String(billCount + 1).padStart(4, "0")}`;

    const total = items.reduce((sum, { quantity }, i) => {
      return sum + quantity * Number(inventoryRecords[i].unitPrice);
    }, 0);

    const bill = await tx.bill.create({
      data: {
        billNumber,
        customerEmail,
        customerName: customerName || null,
        total,
        status: "paid",
        items: {
          create: items.map(({ inventoryId, quantity }, i) => {
            const rec = inventoryRecords[i];
            const unitPrice = Number(rec.unitPrice);
            return { inventoryId, itemName: rec.itemName, unitPrice, quantity, subtotal: quantity * unitPrice };
          }),
        },
      },
      include: { items: true },
    });

    // Step 3 — Deduct inventory & log OUT transactions
    await Promise.all(
      items.map(({ inventoryId, quantity }) =>
        tx.inventory.update({
          where: { id: inventoryId },
          data: { quantity: { decrement: quantity } },
        })
      )
    );

    await Promise.all(
      items.map(({ inventoryId, quantity }) =>
        tx.transaction.create({
          data: { inventoryId, type: "OUT", quantity, notes: `POS sale — ${bill.billNumber}` },
        })
      )
    );

    // Step 3b — Upsert daily_sales so Dashboard & dead-stock charts stay accurate
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Promise.all(
      items.map(async ({ inventoryId, quantity }) => {
        const existing = await tx.dailySale.findFirst({
          where: { inventoryId, saleDate: today },
        });
        if (existing) {
          await tx.dailySale.update({
            where: { id: existing.id },
            data: { quantitySold: { increment: quantity } },
          });
        } else {
          await tx.dailySale.create({
            data: { inventoryId, saleDate: today, quantitySold: quantity },
          });
        }
      })
    );

    return bill;
  });

  // Step 4 — Background: trigger low-stock alerts
  items.forEach(({ inventoryId }) => {
    checkAndTriggerAlert(inventoryId).catch(console.error);
  });

  // Step 5 — Background: send bill email
  sendBillEmail(result, result.items, customerEmail).catch((err) => {
    console.error("Bill email failed:", err.message);
  });

  return result;
};

module.exports = { processCheckout };
