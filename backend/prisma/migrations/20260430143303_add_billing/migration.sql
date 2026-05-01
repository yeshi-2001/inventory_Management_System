-- CreateTable
CREATE TABLE "bills" (
    "id" SERIAL NOT NULL,
    "bill_number" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_name" TEXT,
    "total" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'paid',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bill_items" (
    "id" SERIAL NOT NULL,
    "bill_id" INTEGER NOT NULL,
    "inventory_id" INTEGER,
    "item_name" TEXT NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "bill_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bills_bill_number_key" ON "bills"("bill_number");

-- CreateIndex
CREATE INDEX "bill_items_bill_id_idx" ON "bill_items"("bill_id");

-- CreateIndex
CREATE INDEX "bill_items_inventory_id_idx" ON "bill_items"("inventory_id");

-- AddForeignKey
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_bill_id_fkey"
    FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_inventory_id_fkey"
    FOREIGN KEY ("inventory_id") REFERENCES "inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
