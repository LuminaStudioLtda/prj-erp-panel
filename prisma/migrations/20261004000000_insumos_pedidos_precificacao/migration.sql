-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "order_status" ADD VALUE 'DRAFT';
ALTER TYPE "order_status" ADD VALUE 'AWAITING_PRODUCTION';

-- AlterTable
ALTER TABLE "materials" ADD COLUMN     "brand" VARCHAR(120),
ADD COLUMN     "cone_price" DECIMAL(12,2),
ADD COLUMN     "cone_yield" DECIMAL(12,3),
ADD COLUMN     "line" VARCHAR(120),
ADD COLUMN     "sku" VARCHAR(60),
ADD COLUMN     "tex" INTEGER,
ADD COLUMN     "visual_color" VARCHAR(80);

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "code" VARCHAR(24),
ADD COLUMN     "customer_contact" VARCHAR(80),
ADD COLUMN     "expected_delivery_at" TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "code" VARCHAR(40);

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "indirect_costs" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "note" TEXT;

-- CreateTable
CREATE TABLE "order_counters" (
    "year" INTEGER NOT NULL,
    "last_value" INTEGER NOT NULL,

    CONSTRAINT "order_counters_pkey" PRIMARY KEY ("year")
);

-- CreateIndex
CREATE UNIQUE INDEX "materials_sku_key" ON "materials"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "orders_code_key" ON "orders"("code");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");


-- Backfill dos códigos de pedidos já existentes (#LUM-AAAA-XXXX, sequencial por ano).
WITH numerados AS (
  SELECT id,
         EXTRACT(YEAR FROM created_at)::int AS ano,
         ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM created_at) ORDER BY created_at, id) AS n
  FROM "orders"
  WHERE "code" IS NULL
)
UPDATE "orders" o
SET "code" = '#LUM-' || numerados.ano || '-' || LPAD(numerados.n::text, 4, '0')
FROM numerados
WHERE o.id = numerados.id;

INSERT INTO "order_counters" ("year", "last_value")
SELECT split_part("code", '-', 2)::int, MAX(split_part("code", '-', 3)::int)
FROM "orders"
WHERE "code" ~ '^#LUM-[0-9]{4}-[0-9]+$'
GROUP BY 1
ON CONFLICT ("year") DO UPDATE SET "last_value" = GREATEST("order_counters"."last_value", EXCLUDED."last_value");

-- Só ADMIN enxerga e altera o contador de códigos.
ALTER TABLE "order_counters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_counters" FORCE ROW LEVEL SECURITY;
CREATE POLICY "order_counters_admin_access" ON "order_counters" FOR ALL
  USING (current_setting('app.role', true) = 'ADMIN')
  WITH CHECK (current_setting('app.role', true) = 'ADMIN');
