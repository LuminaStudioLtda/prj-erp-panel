-- Dados de desenvolvimento do Lumina ERP: insumos, lotes, produtos e fichas técnicas.
-- Idempotente: pode ser executado várias vezes (pnpm db:seed).

INSERT INTO materials (id, sku, name, brand, line, tex, visual_color, kind, unit, cone_price, cone_yield, cone_meters, reorder_point, updated_at) VALUES
  ('mat-fio-alg-001', 'FIO-ALG-001', 'Fio Algodão Mercerizado 100%', 'Círculo Charme', NULL, 378, 'Terracota Argila', 'Fios & Lãs', 'GRAM', 42.00, 400, 396, 200, now()),
  ('mat-la-mer-002', 'LA-MER-002', 'Lã Pura Merino Extrafina', 'Fiação da Serra', '19.5 micras', NULL, 'Verde Musgo', 'Fios & Lãs', 'GRAM', 68.00, 250, 210, 150, now()),
  ('mat-cor-alg-003', 'COR-ALG-003', 'Cordão Algodão 4mm 24 Fios', 'EuroRoma Spesso', 'Reciclado', NULL, 'Cru Natural', 'Fios & Lãs', 'GRAM', 36.50, 1000, 254, 300, now()),
  ('mat-sed-art-004', 'SED-ART-004', 'Seda Pura Artesanal Brasileira', 'Casulo Feliz', 'Tingida c/ Cúrcuma', NULL, 'Dourado Amêndoa', 'Fios & Lãs', 'GRAM', 84.00, 150, 320, 250, now()),
  ('mat-enc-sil-005', 'ENC-SIL-005', 'Enchimento Siliconado Premium', 'MaxFill', NULL, NULL, 'Branco', 'Aviamentos', 'GRAM', 18.00, 500, NULL, 500, now()),
  ('mat-zip-nyl-006', 'ZIP-NYL-006', 'Zíper de Náilon Invisível 20cm', 'YKK', NULL, NULL, 'Terracota', 'Aviamentos', 'UNIT', 3.20, 1, NULL, 20, now())
ON CONFLICT (id) DO NOTHING;

-- Lotes: o primeiro insumo tem dois lotes com custos diferentes para exercitar o custo ponderado.
INSERT INTO material_lots (id, material_id, reference, unit_cost, quantity_on_hand, received_at) VALUES
  ('lot-001-a', 'mat-fio-alg-001', 'Lot #8940-A', 0.1050, 440, now() - interval '60 days'),
  ('lot-001-b', 'mat-fio-alg-001', 'Lot #9012-B', 0.1200, 400, now() - interval '20 days'),
  ('lot-002-a', 'mat-la-mer-002', 'Lot #8318-M', 0.2720, 120, now() - interval '45 days'),
  ('lot-003-a', 'mat-cor-alg-003', 'Lot #2214-CR', 0.0365, 3400, now() - interval '30 days'),
  ('lot-004-a', 'mat-sed-art-004', 'Lot #SD-09', 0.5600, 300, now() - interval '40 days'),
  ('lot-005-a', 'mat-enc-sil-005', 'Lot #EN-21', 0.0360, 2500, now() - interval '25 days'),
  ('lot-006-a', 'mat-zip-nyl-006', 'Lot #ZP-04', 3.2000, 40, now() - interval '15 days')
ON CONFLICT (id) DO NOTHING;

-- Histórico inicial: uma entrada por lote (e uma perda no merino, para a linha do tempo ter variedade).
INSERT INTO stock_movements (id, material_id, material_lot_id, reason, origin, note, quantity_delta, resulting_stock, created_at) VALUES
  ('mov-001-a', 'mat-fio-alg-001', 'lot-001-a', 'PURCHASE', 'Entrada inicial', 'Lot #8940-A', 440, 440, now() - interval '60 days'),
  ('mov-001-b', 'mat-fio-alg-001', 'lot-001-b', 'PURCHASE', 'Entrada de lote', 'Lot #9012-B', 400, 840, now() - interval '20 days'),
  ('mov-002-a', 'mat-la-mer-002', 'lot-002-a', 'PURCHASE', 'Entrada inicial', 'Lot #8318-M', 150, 150, now() - interval '45 days'),
  ('mov-002-b', 'mat-la-mer-002', 'lot-002-a', 'LOSS', 'Baixa manual', 'Sobra inutilizável após teste de ponto', -30, 120, now() - interval '10 days'),
  ('mov-003-a', 'mat-cor-alg-003', 'lot-003-a', 'PURCHASE', 'Entrada inicial', 'Lot #2214-CR', 3400, 3400, now() - interval '30 days'),
  ('mov-004-a', 'mat-sed-art-004', 'lot-004-a', 'PURCHASE', 'Entrada inicial', 'Lot #SD-09', 300, 300, now() - interval '40 days'),
  ('mov-005-a', 'mat-enc-sil-005', 'lot-005-a', 'PURCHASE', 'Entrada inicial', 'Lot #EN-21', 2500, 2500, now() - interval '25 days'),
  ('mov-006-a', 'mat-zip-nyl-006', 'lot-006-a', 'PURCHASE', 'Entrada inicial', 'Lot #ZP-04', 40, 40, now() - interval '15 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, code, name, slug, description, status, sales_modes, price, made_to_order_days, updated_at) VALUES
  ('prod-0001', 'LUM-P-0001', 'Cardigan Aurora Cru', 'cardigan-aurora-cru', 'Cardigan em algodão mercerizado, feito sob medida.', 'ACTIVE', '{MADE_TO_ORDER}', 480.00, 12, now()),
  ('prod-0002', 'LUM-P-0002', 'Bolsa Tecida Terracota', 'bolsa-tecida-terracota', 'Bolsa em cordão de algodão com zíper e forro.', 'ACTIVE', '{MADE_TO_ORDER}', 189.90, 7, now()),
  ('prod-0003', 'LUM-P-0003', 'Chaveiro Amigurumi', 'chaveiro-amigurumi', 'Chaveiro amigurumi enchido com fibra siliconada.', 'ACTIVE', '{MADE_TO_ORDER}', 50.00, 3, now()),
  ('prod-0004', 'LUM-P-0004', 'Touca Merino Verde Musgo', 'touca-merino-verde-musgo', 'Touca em lã merino extrafina.', 'ACTIVE', '{MADE_TO_ORDER}', 160.00, 5, now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO recipes (id, product_id, estimated_minutes, indirect_costs, updated_at) VALUES
  ('rec-0001', 'prod-0001', 420, 8.00, now()),
  ('rec-0002', 'prod-0002', 300, 5.00, now()),
  ('rec-0003', 'prod-0003', 90, 2.50, now()),
  ('rec-0004', 'prod-0004', 150, 3.00, now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO recipe_items (id, recipe_id, material_id, quantity) VALUES
  ('ri-0001-1', 'rec-0001', 'mat-fio-alg-001', 450),
  ('ri-0002-1', 'rec-0002', 'mat-cor-alg-003', 380),
  ('ri-0002-2', 'rec-0002', 'mat-zip-nyl-006', 1),
  ('ri-0003-1', 'rec-0003', 'mat-fio-alg-001', 40),
  ('ri-0003-2', 'rec-0003', 'mat-enc-sil-005', 25),
  ('ri-0004-1', 'rec-0004', 'mat-la-mer-002', 90)
ON CONFLICT (id) DO NOTHING;
