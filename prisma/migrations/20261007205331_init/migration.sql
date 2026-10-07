-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "dw";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('CLIENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "material_unit" AS ENUM ('UNIT', 'GRAM', 'KILOGRAM', 'MILLILITER', 'LITER', 'METER', 'CENTIMETER');

-- CreateEnum
CREATE TYPE "product_status" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "sales_mode" AS ENUM ('READY_TO_SHIP', 'MADE_TO_ORDER');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('AWAITING_PAYMENT', 'IN_PRODUCTION', 'READY_TO_SHIP', 'SHIPPED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "stock_movement_reason" AS ENUM ('PURCHASE', 'ADJUSTMENT', 'PRODUCTION', 'ORDER', 'RETURN', 'LOSS');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "password_hash" VARCHAR(255),
    "role" "user_role" NOT NULL DEFAULT 'CLIENT',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "kind" VARCHAR(80) NOT NULL,
    "unit" "material_unit" NOT NULL,
    "reorder_point" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_lots" (
    "id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "reference" VARCHAR(120),
    "unit_cost" DECIMAL(12,4) NOT NULL,
    "quantity_on_hand" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "received_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "estimated_minutes" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_items" (
    "id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,

    CONSTRAINT "recipe_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "category_id" TEXT,
    "name" VARCHAR(180) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "product_status" NOT NULL DEFAULT 'DRAFT',
    "sales_modes" "sales_mode"[],
    "price" DECIMAL(12,2) NOT NULL,
    "ready_stock" INTEGER NOT NULL DEFAULT 0,
    "made_to_order_days" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "customer_name" VARCHAR(160) NOT NULL,
    "customer_email" VARCHAR(320) NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "total" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_name" VARCHAR(180) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "material_id" TEXT,
    "material_lot_id" TEXT,
    "product_id" TEXT,
    "order_id" TEXT,
    "actor_id" TEXT,
    "reason" "stock_movement_reason" NOT NULL,
    "origin" VARCHAR(160) NOT NULL,
    "quantity_delta" DECIMAL(12,3) NOT NULL,
    "resulting_stock" DECIMAL(12,3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_settings" (
    "id" VARCHAR(32) NOT NULL DEFAULT 'default',
    "hourly_rate" DECIMAL(12,2) NOT NULL,
    "loss_rate" DECIMAL(7,4) NOT NULL,
    "desired_margin_percent" DECIMAL(7,4) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pricing_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dw"."dim_tempo" (
    "sk_tempo" INTEGER NOT NULL,
    "data_completa" DATE NOT NULL,
    "dia" SMALLINT NOT NULL,
    "mes" SMALLINT NOT NULL,
    "nome_mes" VARCHAR(20) NOT NULL,
    "trimestre" SMALLINT NOT NULL,
    "ano" SMALLINT NOT NULL,
    "dia_semana" VARCHAR(20) NOT NULL,
    "fim_de_semana" BOOLEAN NOT NULL,
    "feriado" BOOLEAN NOT NULL,

    CONSTRAINT "dim_tempo_pkey" PRIMARY KEY ("sk_tempo")
);

-- CreateTable
CREATE TABLE "dw"."dim_cliente" (
    "sk_cliente" BIGSERIAL NOT NULL,
    "id_cliente" VARCHAR(30) NOT NULL,
    "nome" VARCHAR(160) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "cidade" VARCHAR(120),
    "uf" CHAR(2),
    "data_cadastro" DATE NOT NULL,
    "vigencia_inicio" DATE NOT NULL,
    "vigencia_fim" DATE,
    "registro_atual" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "dim_cliente_pkey" PRIMARY KEY ("sk_cliente")
);

-- CreateTable
CREATE TABLE "dw"."dim_produto" (
    "sk_produto" BIGSERIAL NOT NULL,
    "id_variacao" VARCHAR(30) NOT NULL,
    "sku" VARCHAR(80) NOT NULL,
    "nome_produto" VARCHAR(180) NOT NULL,
    "categoria" VARCHAR(120),
    "tipo" VARCHAR(80),
    "cor" VARCHAR(80),
    "tamanho" VARCHAR(40),
    "composicao" VARCHAR(160),
    "metragem_m" INTEGER,
    "gramatura_g" INTEGER,
    "espessura_agulha_mm" DECIMAL(4,2),
    "aceita_troca" BOOLEAN NOT NULL,

    CONSTRAINT "dim_produto_pkey" PRIMARY KEY ("sk_produto")
);

-- CreateTable
CREATE TABLE "dw"."dim_lote" (
    "sk_lote" BIGSERIAL NOT NULL,
    "id_lote" VARCHAR(30) NOT NULL,
    "codigo_lote" VARCHAR(120),

    CONSTRAINT "dim_lote_pkey" PRIMARY KEY ("sk_lote")
);

-- CreateTable
CREATE TABLE "dw"."dim_geografia" (
    "sk_geografia" SERIAL NOT NULL,
    "cep" VARCHAR(8) NOT NULL,
    "cidade" VARCHAR(120) NOT NULL,
    "uf" CHAR(2) NOT NULL,
    "regiao" VARCHAR(20) NOT NULL,

    CONSTRAINT "dim_geografia_pkey" PRIMARY KEY ("sk_geografia")
);

-- CreateTable
CREATE TABLE "dw"."dim_cupom" (
    "sk_cupom" SERIAL NOT NULL,
    "codigo" VARCHAR(60) NOT NULL,
    "tipo_desconto" VARCHAR(40) NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "dim_cupom_pkey" PRIMARY KEY ("sk_cupom")
);

-- CreateTable
CREATE TABLE "dw"."dim_pagamento" (
    "sk_pagamento" SERIAL NOT NULL,
    "metodo" VARCHAR(40) NOT NULL,
    "status" VARCHAR(40) NOT NULL,

    CONSTRAINT "dim_pagamento_pkey" PRIMARY KEY ("sk_pagamento")
);

-- CreateTable
CREATE TABLE "dw"."dim_tipo_movimentacao" (
    "sk_tipo_movimentacao" SERIAL NOT NULL,
    "tipo" VARCHAR(40) NOT NULL,
    "sentido" SMALLINT NOT NULL,

    CONSTRAINT "dim_tipo_movimentacao_pkey" PRIMARY KEY ("sk_tipo_movimentacao")
);

-- CreateTable
CREATE TABLE "dw"."dim_motivo_devolucao" (
    "sk_motivo_devolucao" SERIAL NOT NULL,
    "motivo" VARCHAR(160) NOT NULL,

    CONSTRAINT "dim_motivo_devolucao_pkey" PRIMARY KEY ("sk_motivo_devolucao")
);

-- CreateTable
CREATE TABLE "dw"."dim_transportadora" (
    "sk_transportadora" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,

    CONSTRAINT "dim_transportadora_pkey" PRIMARY KEY ("sk_transportadora")
);

-- CreateTable
CREATE TABLE "dw"."dim_artesa" (
    "sk_artesa" SERIAL NOT NULL,
    "nome" VARCHAR(160) NOT NULL,

    CONSTRAINT "dim_artesa_pkey" PRIMARY KEY ("sk_artesa")
);

-- CreateTable
CREATE TABLE "dw"."fato_vendas" (
    "id_item_pedido" VARCHAR(30) NOT NULL,
    "id_pedido" VARCHAR(30) NOT NULL,
    "status_pedido" VARCHAR(40) NOT NULL,
    "sk_data_pedido" INTEGER NOT NULL,
    "sk_cliente" BIGINT NOT NULL,
    "sk_produto" BIGINT NOT NULL,
    "sk_geografia_entrega" INTEGER NOT NULL,
    "sk_cupom" INTEGER,
    "sk_lote" BIGINT,
    "quantidade" INTEGER NOT NULL,
    "preco_unitario" DECIMAL(12,2) NOT NULL,
    "valor_bruto" DECIMAL(12,2) NOT NULL,
    "desconto_rateado" DECIMAL(12,2) NOT NULL,
    "frete_rateado" DECIMAL(12,2) NOT NULL,
    "valor_liquido" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "fato_vendas_pkey" PRIMARY KEY ("id_item_pedido")
);

-- CreateTable
CREATE TABLE "dw"."fato_pagamento" (
    "id_pagamento" VARCHAR(30) NOT NULL,
    "id_pedido" VARCHAR(30) NOT NULL,
    "sk_data_pagamento" INTEGER NOT NULL,
    "sk_cliente" BIGINT NOT NULL,
    "sk_pagamento" INTEGER NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "parcelas" INTEGER NOT NULL,

    CONSTRAINT "fato_pagamento_pkey" PRIMARY KEY ("id_pagamento")
);

-- CreateTable
CREATE TABLE "dw"."fato_avaliacao" (
    "id_avaliacao" VARCHAR(30) NOT NULL,
    "sk_data" INTEGER NOT NULL,
    "sk_cliente" BIGINT NOT NULL,
    "sk_produto" BIGINT NOT NULL,
    "nota" SMALLINT NOT NULL,

    CONSTRAINT "fato_avaliacao_pkey" PRIMARY KEY ("id_avaliacao")
);

-- CreateTable
CREATE TABLE "dw"."fato_devolucao" (
    "id_devolucao" VARCHAR(30) NOT NULL,
    "id_item_pedido" VARCHAR(30) NOT NULL,
    "sk_data" INTEGER NOT NULL,
    "sk_cliente" BIGINT NOT NULL,
    "sk_produto" BIGINT NOT NULL,
    "sk_motivo_devolucao" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "valor_devolvido" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "fato_devolucao_pkey" PRIMARY KEY ("id_devolucao")
);

-- CreateTable
CREATE TABLE "dw"."fato_estoque" (
    "id_movimentacao" VARCHAR(30) NOT NULL,
    "motivo" VARCHAR(160) NOT NULL,
    "sk_data" INTEGER NOT NULL,
    "sk_produto" BIGINT,
    "sk_lote" BIGINT,
    "sk_tipo_movimentacao" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "fato_estoque_pkey" PRIMARY KEY ("id_movimentacao")
);

-- CreateTable
CREATE TABLE "dw"."fato_envio" (
    "id_envio" VARCHAR(30) NOT NULL,
    "id_pedido" VARCHAR(30) NOT NULL,
    "sk_data_postagem" INTEGER NOT NULL,
    "sk_data_entrega" INTEGER,
    "sk_transportadora" INTEGER NOT NULL,
    "sk_geografia_destino" INTEGER NOT NULL,
    "prazo_prometido_dias" INTEGER NOT NULL,
    "prazo_real_dias" INTEGER,
    "entregue_no_prazo" SMALLINT,

    CONSTRAINT "fato_envio_pkey" PRIMARY KEY ("id_envio")
);

-- CreateTable
CREATE TABLE "dw"."fato_producao" (
    "id_item_pedido" VARCHAR(30) NOT NULL,
    "sk_data_inicio" INTEGER NOT NULL,
    "sk_data_conclusao" INTEGER,
    "sk_produto" BIGINT NOT NULL,
    "sk_artesa" INTEGER NOT NULL,
    "dias_prazo" INTEGER NOT NULL,
    "dias_producao" INTEGER,
    "dias_atraso" INTEGER,

    CONSTRAINT "fato_producao_pkey" PRIMARY KEY ("id_item_pedido")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "materials_name_idx" ON "materials"("name");

-- CreateIndex
CREATE INDEX "material_lots_material_id_received_at_idx" ON "material_lots"("material_id", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "recipes_product_id_key" ON "recipes"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_items_recipe_id_material_id_key" ON "recipe_items"("recipe_id", "material_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_category_id_status_idx" ON "products"("category_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "stock_movements_material_id_created_at_idx" ON "stock_movements"("material_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_movements_product_id_created_at_idx" ON "stock_movements"("product_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "dim_tempo_data_completa_key" ON "dw"."dim_tempo"("data_completa");

-- CreateIndex
CREATE INDEX "dim_cliente_id_cliente_registro_atual_idx" ON "dw"."dim_cliente"("id_cliente", "registro_atual");

-- CreateIndex
CREATE UNIQUE INDEX "dim_cliente_id_cliente_vigencia_inicio_key" ON "dw"."dim_cliente"("id_cliente", "vigencia_inicio");

-- CreateIndex
CREATE UNIQUE INDEX "dim_produto_id_variacao_key" ON "dw"."dim_produto"("id_variacao");

-- CreateIndex
CREATE INDEX "dim_produto_sku_idx" ON "dw"."dim_produto"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "dim_lote_id_lote_key" ON "dw"."dim_lote"("id_lote");

-- CreateIndex
CREATE UNIQUE INDEX "dim_geografia_cep_key" ON "dw"."dim_geografia"("cep");

-- CreateIndex
CREATE UNIQUE INDEX "dim_cupom_codigo_key" ON "dw"."dim_cupom"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "dim_pagamento_metodo_status_key" ON "dw"."dim_pagamento"("metodo", "status");

-- CreateIndex
CREATE UNIQUE INDEX "dim_tipo_movimentacao_tipo_key" ON "dw"."dim_tipo_movimentacao"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "dim_motivo_devolucao_motivo_key" ON "dw"."dim_motivo_devolucao"("motivo");

-- CreateIndex
CREATE UNIQUE INDEX "dim_transportadora_nome_key" ON "dw"."dim_transportadora"("nome");

-- CreateIndex
CREATE INDEX "fato_vendas_id_pedido_idx" ON "dw"."fato_vendas"("id_pedido");

-- CreateIndex
CREATE INDEX "fato_vendas_sk_data_pedido_idx" ON "dw"."fato_vendas"("sk_data_pedido");

-- CreateIndex
CREATE INDEX "fato_vendas_sk_cliente_idx" ON "dw"."fato_vendas"("sk_cliente");

-- CreateIndex
CREATE INDEX "fato_vendas_sk_produto_idx" ON "dw"."fato_vendas"("sk_produto");

-- CreateIndex
CREATE INDEX "fato_vendas_sk_geografia_entrega_idx" ON "dw"."fato_vendas"("sk_geografia_entrega");

-- CreateIndex
CREATE INDEX "fato_vendas_sk_cupom_idx" ON "dw"."fato_vendas"("sk_cupom");

-- CreateIndex
CREATE INDEX "fato_vendas_sk_lote_idx" ON "dw"."fato_vendas"("sk_lote");

-- CreateIndex
CREATE INDEX "fato_pagamento_id_pedido_idx" ON "dw"."fato_pagamento"("id_pedido");

-- CreateIndex
CREATE INDEX "fato_pagamento_sk_data_pagamento_idx" ON "dw"."fato_pagamento"("sk_data_pagamento");

-- CreateIndex
CREATE INDEX "fato_pagamento_sk_cliente_idx" ON "dw"."fato_pagamento"("sk_cliente");

-- CreateIndex
CREATE INDEX "fato_pagamento_sk_pagamento_idx" ON "dw"."fato_pagamento"("sk_pagamento");

-- CreateIndex
CREATE INDEX "fato_avaliacao_sk_data_idx" ON "dw"."fato_avaliacao"("sk_data");

-- CreateIndex
CREATE INDEX "fato_avaliacao_sk_cliente_idx" ON "dw"."fato_avaliacao"("sk_cliente");

-- CreateIndex
CREATE INDEX "fato_avaliacao_sk_produto_idx" ON "dw"."fato_avaliacao"("sk_produto");

-- CreateIndex
CREATE INDEX "fato_devolucao_id_item_pedido_idx" ON "dw"."fato_devolucao"("id_item_pedido");

-- CreateIndex
CREATE INDEX "fato_devolucao_sk_data_idx" ON "dw"."fato_devolucao"("sk_data");

-- CreateIndex
CREATE INDEX "fato_devolucao_sk_cliente_idx" ON "dw"."fato_devolucao"("sk_cliente");

-- CreateIndex
CREATE INDEX "fato_devolucao_sk_produto_idx" ON "dw"."fato_devolucao"("sk_produto");

-- CreateIndex
CREATE INDEX "fato_devolucao_sk_motivo_devolucao_idx" ON "dw"."fato_devolucao"("sk_motivo_devolucao");

-- CreateIndex
CREATE INDEX "fato_estoque_sk_data_idx" ON "dw"."fato_estoque"("sk_data");

-- CreateIndex
CREATE INDEX "fato_estoque_sk_produto_idx" ON "dw"."fato_estoque"("sk_produto");

-- CreateIndex
CREATE INDEX "fato_estoque_sk_lote_idx" ON "dw"."fato_estoque"("sk_lote");

-- CreateIndex
CREATE INDEX "fato_estoque_sk_tipo_movimentacao_idx" ON "dw"."fato_estoque"("sk_tipo_movimentacao");

-- CreateIndex
CREATE INDEX "fato_envio_id_pedido_idx" ON "dw"."fato_envio"("id_pedido");

-- CreateIndex
CREATE INDEX "fato_envio_sk_data_postagem_idx" ON "dw"."fato_envio"("sk_data_postagem");

-- CreateIndex
CREATE INDEX "fato_envio_sk_data_entrega_idx" ON "dw"."fato_envio"("sk_data_entrega");

-- CreateIndex
CREATE INDEX "fato_envio_sk_transportadora_idx" ON "dw"."fato_envio"("sk_transportadora");

-- CreateIndex
CREATE INDEX "fato_envio_sk_geografia_destino_idx" ON "dw"."fato_envio"("sk_geografia_destino");

-- CreateIndex
CREATE INDEX "fato_producao_sk_data_inicio_idx" ON "dw"."fato_producao"("sk_data_inicio");

-- CreateIndex
CREATE INDEX "fato_producao_sk_data_conclusao_idx" ON "dw"."fato_producao"("sk_data_conclusao");

-- CreateIndex
CREATE INDEX "fato_producao_sk_produto_idx" ON "dw"."fato_producao"("sk_produto");

-- CreateIndex
CREATE INDEX "fato_producao_sk_artesa_idx" ON "dw"."fato_producao"("sk_artesa");

-- AddForeignKey
ALTER TABLE "material_lots" ADD CONSTRAINT "material_lots_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_material_lot_id_fkey" FOREIGN KEY ("material_lot_id") REFERENCES "material_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_vendas" ADD CONSTRAINT "fato_vendas_sk_data_pedido_fkey" FOREIGN KEY ("sk_data_pedido") REFERENCES "dw"."dim_tempo"("sk_tempo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_vendas" ADD CONSTRAINT "fato_vendas_sk_cliente_fkey" FOREIGN KEY ("sk_cliente") REFERENCES "dw"."dim_cliente"("sk_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_vendas" ADD CONSTRAINT "fato_vendas_sk_produto_fkey" FOREIGN KEY ("sk_produto") REFERENCES "dw"."dim_produto"("sk_produto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_vendas" ADD CONSTRAINT "fato_vendas_sk_geografia_entrega_fkey" FOREIGN KEY ("sk_geografia_entrega") REFERENCES "dw"."dim_geografia"("sk_geografia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_vendas" ADD CONSTRAINT "fato_vendas_sk_cupom_fkey" FOREIGN KEY ("sk_cupom") REFERENCES "dw"."dim_cupom"("sk_cupom") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_vendas" ADD CONSTRAINT "fato_vendas_sk_lote_fkey" FOREIGN KEY ("sk_lote") REFERENCES "dw"."dim_lote"("sk_lote") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_pagamento" ADD CONSTRAINT "fato_pagamento_sk_data_pagamento_fkey" FOREIGN KEY ("sk_data_pagamento") REFERENCES "dw"."dim_tempo"("sk_tempo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_pagamento" ADD CONSTRAINT "fato_pagamento_sk_cliente_fkey" FOREIGN KEY ("sk_cliente") REFERENCES "dw"."dim_cliente"("sk_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_pagamento" ADD CONSTRAINT "fato_pagamento_sk_pagamento_fkey" FOREIGN KEY ("sk_pagamento") REFERENCES "dw"."dim_pagamento"("sk_pagamento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_avaliacao" ADD CONSTRAINT "fato_avaliacao_sk_data_fkey" FOREIGN KEY ("sk_data") REFERENCES "dw"."dim_tempo"("sk_tempo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_avaliacao" ADD CONSTRAINT "fato_avaliacao_sk_cliente_fkey" FOREIGN KEY ("sk_cliente") REFERENCES "dw"."dim_cliente"("sk_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_avaliacao" ADD CONSTRAINT "fato_avaliacao_sk_produto_fkey" FOREIGN KEY ("sk_produto") REFERENCES "dw"."dim_produto"("sk_produto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_devolucao" ADD CONSTRAINT "fato_devolucao_sk_data_fkey" FOREIGN KEY ("sk_data") REFERENCES "dw"."dim_tempo"("sk_tempo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_devolucao" ADD CONSTRAINT "fato_devolucao_sk_cliente_fkey" FOREIGN KEY ("sk_cliente") REFERENCES "dw"."dim_cliente"("sk_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_devolucao" ADD CONSTRAINT "fato_devolucao_sk_produto_fkey" FOREIGN KEY ("sk_produto") REFERENCES "dw"."dim_produto"("sk_produto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_devolucao" ADD CONSTRAINT "fato_devolucao_sk_motivo_devolucao_fkey" FOREIGN KEY ("sk_motivo_devolucao") REFERENCES "dw"."dim_motivo_devolucao"("sk_motivo_devolucao") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_estoque" ADD CONSTRAINT "fato_estoque_sk_data_fkey" FOREIGN KEY ("sk_data") REFERENCES "dw"."dim_tempo"("sk_tempo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_estoque" ADD CONSTRAINT "fato_estoque_sk_produto_fkey" FOREIGN KEY ("sk_produto") REFERENCES "dw"."dim_produto"("sk_produto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_estoque" ADD CONSTRAINT "fato_estoque_sk_lote_fkey" FOREIGN KEY ("sk_lote") REFERENCES "dw"."dim_lote"("sk_lote") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_estoque" ADD CONSTRAINT "fato_estoque_sk_tipo_movimentacao_fkey" FOREIGN KEY ("sk_tipo_movimentacao") REFERENCES "dw"."dim_tipo_movimentacao"("sk_tipo_movimentacao") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_envio" ADD CONSTRAINT "fato_envio_sk_data_postagem_fkey" FOREIGN KEY ("sk_data_postagem") REFERENCES "dw"."dim_tempo"("sk_tempo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_envio" ADD CONSTRAINT "fato_envio_sk_data_entrega_fkey" FOREIGN KEY ("sk_data_entrega") REFERENCES "dw"."dim_tempo"("sk_tempo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_envio" ADD CONSTRAINT "fato_envio_sk_transportadora_fkey" FOREIGN KEY ("sk_transportadora") REFERENCES "dw"."dim_transportadora"("sk_transportadora") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_envio" ADD CONSTRAINT "fato_envio_sk_geografia_destino_fkey" FOREIGN KEY ("sk_geografia_destino") REFERENCES "dw"."dim_geografia"("sk_geografia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_producao" ADD CONSTRAINT "fato_producao_sk_data_inicio_fkey" FOREIGN KEY ("sk_data_inicio") REFERENCES "dw"."dim_tempo"("sk_tempo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_producao" ADD CONSTRAINT "fato_producao_sk_data_conclusao_fkey" FOREIGN KEY ("sk_data_conclusao") REFERENCES "dw"."dim_tempo"("sk_tempo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_producao" ADD CONSTRAINT "fato_producao_sk_produto_fkey" FOREIGN KEY ("sk_produto") REFERENCES "dw"."dim_produto"("sk_produto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dw"."fato_producao" ADD CONSTRAINT "fato_producao_sk_artesa_fkey" FOREIGN KEY ("sk_artesa") REFERENCES "dw"."dim_artesa"("sk_artesa") ON DELETE RESTRICT ON UPDATE CASCADE;
