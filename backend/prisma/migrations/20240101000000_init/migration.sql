-- CreateTable: vendors
CREATE TABLE "vendors" (
  "id"             SERIAL PRIMARY KEY,
  "name"           VARCHAR NOT NULL,
  "email"          VARCHAR NOT NULL UNIQUE,
  "phone"          VARCHAR,
  "lead_time_days" INTEGER NOT NULL DEFAULT 7,
  "created_at"     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- CreateTable: inventory
CREATE TABLE "inventory" (
  "id"                 SERIAL PRIMARY KEY,
  "item_name"          VARCHAR NOT NULL,
  "category"           VARCHAR,
  "quantity"           INTEGER NOT NULL DEFAULT 0,
  "min_quantity"       INTEGER NOT NULL DEFAULT 10,
  "unit_price"         DECIMAL(10,2),
  "warehouse_location" VARCHAR,
  "vendor_id"          INTEGER REFERENCES "vendors"("id") ON DELETE SET NULL,
  "created_at"         TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at"         TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "inventory_quantity_check"     CHECK (quantity >= 0),
  CONSTRAINT "inventory_min_quantity_check" CHECK (min_quantity >= 0)
);

-- Index on vendor_id for fast JOIN queries
CREATE INDEX "inventory_vendor_id_idx" ON "inventory"("vendor_id");

-- CreateTable: daily_sales
CREATE TABLE "daily_sales" (
  "id"            SERIAL PRIMARY KEY,
  "inventory_id"  INTEGER NOT NULL REFERENCES "inventory"("id") ON DELETE CASCADE,
  "sale_date"     DATE NOT NULL,
  "quantity_sold" INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX "daily_sales_inventory_id_idx" ON "daily_sales"("inventory_id");

-- CreateTable: transactions
CREATE TABLE "transactions" (
  "id"           SERIAL PRIMARY KEY,
  "inventory_id" INTEGER NOT NULL REFERENCES "inventory"("id") ON DELETE CASCADE,
  "type"         VARCHAR NOT NULL CHECK (type IN ('IN', 'OUT')),
  "quantity"     INTEGER NOT NULL,
  "notes"        TEXT,
  "created_at"   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- CreateTable: alerts
CREATE TABLE "alerts" (
  "id"           SERIAL PRIMARY KEY,
  "inventory_id" INTEGER NOT NULL REFERENCES "inventory"("id") ON DELETE CASCADE,
  "alert_type"   VARCHAR NOT NULL CHECK (alert_type IN ('low_stock', 'reorder', 'dead_stock')),
  "message"      TEXT NOT NULL,
  "resolved"     BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at"   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- CreateTable: users
CREATE TABLE "users" (
  "id"            SERIAL PRIMARY KEY,
  "email"         VARCHAR NOT NULL UNIQUE,
  "password_hash" VARCHAR NOT NULL,
  "role"          VARCHAR NOT NULL DEFAULT 'staff',
  "created_at"    TIMESTAMP NOT NULL DEFAULT NOW()
);
