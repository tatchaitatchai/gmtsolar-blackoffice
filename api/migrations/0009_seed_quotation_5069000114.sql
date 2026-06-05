-- 0009_seed_quotation_5069000114.sql
-- สร้าง project ตามใบเสนอราคา QT.NO.5069000114 วันที่ 26/5/2026
-- เพื่อตรวจสอบว่าราคาต้นทุนใน DB ตรงกับที่ใช้ในใบเสนอราคาหรือไม่

-- =====================================================
-- CATEGORY: บริการ (สำหรับ line item ค่าติดตั้ง)
-- =====================================================
INSERT INTO categories (name) VALUES ('บริการ') ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- SUPPLIER: อ้างอิงราคาจากใบเสนอราคา (สำหรับสินค้าที่ยังไม่ทราบเจ้า)
-- =====================================================
INSERT INTO suppliers (name, contact, note)
SELECT 'ไม่ระบุเจ้า (QT-5069000114)', NULL,
       'ราคาต้นทุนอ้างอิงจากใบเสนอราคา QT.5069000114 วันที่ 26/5/2026'
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'ไม่ระบุเจ้า (QT-5069000114)');

-- =====================================================
-- PRODUCTS ที่ยังไม่มีใน DB
-- =====================================================

INSERT INTO products (category_id, brand_id, name, model, spec, use_unit)
SELECT
    (SELECT id FROM categories WHERE name = 'แบตเตอรี่'),
    (SELECT id FROM brands WHERE name = 'Deye'),
    'แบตเตอรี่ Deye LV 16kWh 314Ah', 'BAT-DEYE-LV-16KWH',
    '{"capacity_kwh":16,"capacity_ah":314,"voltage":"LV","warranty_y":10}'::jsonb, 'ชุด'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE model = 'BAT-DEYE-LV-16KWH');

INSERT INTO products (category_id, brand_id, name, model, spec, use_unit)
SELECT
    (SELECT id FROM categories WHERE name = 'โครงยึด'),
    (SELECT id FROM brands WHERE name = 'ทั่วไป'),
    'ชุดโครงยึดแผงโซล่าหลังคา (Roof Mounted Clamps)', 'CLAMP-ROOF-LOT',
    '{"type":"roof mount solar clamp set"}'::jsonb, 'ชุด'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE model = 'CLAMP-ROOF-LOT');

INSERT INTO products (category_id, brand_id, name, model, spec, use_unit)
SELECT
    (SELECT id FROM categories WHERE name = 'อุปกรณ์เสริม'),
    (SELECT id FROM brands WHERE name = 'ทั่วไป'),
    'DC/AC Combiner Box (Feeo/Sutree)', 'COMBINER-BOX-FEEO',
    '{"type":"DC/AC combiner box","brands":"Feeo,Sutree"}'::jsonb, 'ชุด'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE model = 'COMBINER-BOX-FEEO');

-- PV-DC Cable 1.5kV 1x4mm² Link Set (R+B) — ซื้อเป็นเซ็ต ไม่ใช่เมตร
INSERT INTO products (category_id, brand_id, name, model, spec, use_unit)
SELECT
    (SELECT id FROM categories WHERE name = 'สายไฟ'),
    (SELECT id FROM brands WHERE name = 'ทั่วไป'),
    'PV-DC Cable 1.5kV 1×4mm² (แดง+ดำ) Link Set', 'PV-4MM-LINK-SET',
    '{"type":"PV DC cable link set","size_mm2":4,"voltage":"1.5kV"}'::jsonb, 'เซ็ต'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE model = 'PV-4MM-LINK-SET');

INSERT INTO products (category_id, brand_id, name, model, spec, use_unit)
SELECT
    (SELECT id FROM categories WHERE name = 'อุปกรณ์เสริม'),
    (SELECT id FROM brands WHERE name = 'ทั่วไป'),
    'Grounding System Rod 2.4m (รวมบ่อกราวด์)', 'GROUND-ROD-2.4M',
    '{"type":"grounding rod","length_m":2.4}'::jsonb, 'ชุด'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE model = 'GROUND-ROD-2.4M');

INSERT INTO products (category_id, brand_id, name, model, spec, use_unit)
SELECT
    (SELECT id FROM categories WHERE name = 'อุปกรณ์เสริม'),
    (SELECT id FROM brands WHERE name = 'ทั่วไป'),
    'ชุดท่อร้อยสาย IMC, Wire Way และ Flexible (กันน้ำ)', 'CONDUIT-IMC-LOT',
    '{"type":"IMC conduit lot with wire way and flexible waterproof"}'::jsonb, 'ชุด'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE model = 'CONDUIT-IMC-LOT');

INSERT INTO products (category_id, brand_id, name, model, spec, use_unit)
SELECT
    (SELECT id FROM categories WHERE name = 'อุปกรณ์เสริม'),
    (SELECT id FROM brands WHERE name = 'ทั่วไป'),
    'อุปกรณ์เบ็ดเตล็ด (MC-4, ป้ายเตือน, Box DC Battery, DC Cable 35mm²)', 'MISC-SOLAR-LOT',
    '{"type":"misc solar accessories","includes":"MC-4,signs,DC box,35sqmm cable"}'::jsonb, 'ชุด'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE model = 'MISC-SOLAR-LOT');

INSERT INTO products (category_id, brand_id, name, model, spec, use_unit)
SELECT
    (SELECT id FROM categories WHERE name = 'บริการ'),
    (SELECT id FROM brands WHERE name = 'ทั่วไป'),
    p.name, p.model, '{}'::jsonb, 'งาน'
FROM (VALUES
    ('ติดตั้งอุปกรณ์ยึดแผงโซล่า',             'INST-PANEL-MOUNT'),
    ('ติดตั้ง Inverter + Battery',              'INST-INVERTER-BAT'),
    ('ติดตั้งระบบไฟฟ้า DC/AC',                'INST-DC-AC'),
    ('ยื่นขออนุญาตการขนานไฟกับการไฟฟ้า',      'INST-PERMIT'),
    ('Commissioning & Setting',                  'INST-COMMISSIONING')
) AS p(name, model)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE model = p.model);

-- =====================================================
-- SUPPLIER PRICES: ราคาต้นทุนอ้างอิงจากใบเสนอราคา
-- ใช้สำหรับสินค้าที่ยังไม่มีราคาจากเจ้าจริงใน DB
-- =====================================================
INSERT INTO supplier_prices (product_id, supplier_id, price, note, effective_date)
SELECT p.id, s.id, pr.price, 'QT-5069000114 ราคาต้นทุน 26/5/2026', '2026-05-26'
FROM (VALUES
    ('BAT-DEYE-LV-16KWH',   65500.00),
    ('CLAMP-ROOF-LOT',        9500.00),
    ('COMBINER-BOX-FEEO',    12500.00),
    ('PV-4MM-LINK-SET',         27.00),
    ('GROUND-ROD-2.4M',       5000.00),
    ('CONDUIT-IMC-LOT',       5500.00),
    ('MISC-SOLAR-LOT',        3000.00),
    ('INST-PANEL-MOUNT',     15000.00),
    ('INST-INVERTER-BAT',     5000.00),
    ('INST-DC-AC',            7500.00),
    ('INST-PERMIT',           5000.00),
    ('INST-COMMISSIONING',    5000.00)
) AS pr(model, price)
JOIN products p ON p.model = pr.model
CROSS JOIN suppliers s
WHERE s.name = 'ไม่ระบุเจ้า (QT-5069000114)'
  AND NOT EXISTS (
    SELECT 1 FROM supplier_prices sp
    WHERE sp.product_id = p.id AND sp.supplier_id = s.id
  );

-- =====================================================
-- PROJECT
-- =====================================================
INSERT INTO projects (id, name, customer_name, address)
SELECT
    'fef05069-0001-4001-a000-000000000001'::uuid,
    'QT-5069000114 บ้านลูกค้า สมุทรปราการ',
    'ลูกค้า ต.แพรกสา อ.เมือง จ.สมุทรปราการ',
    '1122/354 มบ.เดอะทัส ต.แพรกสา อ.เมือง จ.สมุทรปราการ 10280'
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE id = 'fef05069-0001-4001-a000-000000000001'::uuid
);

-- =====================================================
-- PROJECT ITEMS
-- unit_price_snapshot = ราคาต่อ use_unit ที่ถูกที่สุด
--
-- รายการที่ราคา DB ≠ ราคาในใบเสนอราคา:
--   แผง JA Solar 635W:    DB ถูกสุด = 2,660/แผง  (QT = 3,059)  × 10 → 26,600 vs 30,590
--   สาย AC YAZAKI 6mm²:   DB ถูกสุด = 30.66/ม.  (QT = 40.00)  × 100 →  3,066 vs  4,000
--
-- รายการที่ใช้ราคาจากใบเสนอราคา (ยังไม่มีเจ้าจริงใน DB):
--   CLAMP-ROOF-LOT, COMBINER-BOX-FEEO, PV-4MM-LINK-SET, GROUND-ROD-2.4M,
--   CONDUIT-IMC-LOT, MISC-SOLAR-LOT, INST-* ทั้ง 5 รายการ
--
-- ยอดรวม DB (คาดการณ์): 108,066 บาท
-- ยอดรวมใบเสนอราคา (SUM PRICE): 112,990 บาท
-- ส่วนต่าง: 4,924 บาท (มาจากแผง 3,990 + สาย AC 934)
-- =====================================================

-- แผง JA Solar 635W × 10 — ใช้ราคาถูกสุดจาก DB (Mega = 2,660/แผง)
INSERT INTO project_items (project_id, product_id, supplier_price_id, quantity, unit_price_snapshot)
SELECT
    'fef05069-0001-4001-a000-000000000001'::uuid,
    p.id,
    (SELECT sp.id FROM supplier_prices sp WHERE sp.product_id = p.id ORDER BY sp.price ASC LIMIT 1),
    10,
    (SELECT sp.price FROM supplier_prices sp WHERE sp.product_id = p.id ORDER BY sp.price ASC LIMIT 1)
FROM products p
WHERE p.model = '635W-MONO'
  AND NOT EXISTS (
    SELECT 1 FROM project_items pi
    WHERE pi.project_id = 'fef05069-0001-4001-a000-000000000001'::uuid AND pi.product_id = p.id
  );

-- ชุดโครงยึดแผงโซล่า × 1 ชุด (9,500)
INSERT INTO project_items (project_id, product_id, supplier_price_id, quantity, unit_price_snapshot)
SELECT
    'fef05069-0001-4001-a000-000000000001'::uuid,
    p.id,
    (SELECT sp.id FROM supplier_prices sp WHERE sp.product_id = p.id ORDER BY sp.price ASC LIMIT 1),
    1,
    (SELECT sp.price FROM supplier_prices sp WHERE sp.product_id = p.id ORDER BY sp.price ASC LIMIT 1)
FROM products p
WHERE p.model = 'CLAMP-ROOF-LOT'
  AND NOT EXISTS (
    SELECT 1 FROM project_items pi
    WHERE pi.project_id = 'fef05069-0001-4001-a000-000000000001'::uuid AND pi.product_id = p.id
  );

-- DC/AC Combiner Box × 1 ชุด (12,500)
INSERT INTO project_items (project_id, product_id, supplier_price_id, quantity, unit_price_snapshot)
SELECT
    'fef05069-0001-4001-a000-000000000001'::uuid,
    p.id,
    (SELECT sp.id FROM supplier_prices sp WHERE sp.product_id = p.id ORDER BY sp.price ASC LIMIT 1),
    1,
    (SELECT sp.price FROM supplier_prices sp WHERE sp.product_id = p.id ORDER BY sp.price ASC LIMIT 1)
FROM products p
WHERE p.model = 'COMBINER-BOX-FEEO'
  AND NOT EXISTS (
    SELECT 1 FROM project_items pi
    WHERE pi.project_id = 'fef05069-0001-4001-a000-000000000001'::uuid AND pi.product_id = p.id
  );

-- PV-DC Cable Link Set × 200 เซ็ต (27/เซ็ต)
INSERT INTO project_items (project_id, product_id, supplier_price_id, quantity, unit_price_snapshot)
SELECT
    'fef05069-0001-4001-a000-000000000001'::uuid,
    p.id,
    (SELECT sp.id FROM supplier_prices sp WHERE sp.product_id = p.id ORDER BY sp.price ASC LIMIT 1),
    200,
    (SELECT sp.price FROM supplier_prices sp WHERE sp.product_id = p.id ORDER BY sp.price ASC LIMIT 1)
FROM products p
WHERE p.model = 'PV-4MM-LINK-SET'
  AND NOT EXISTS (
    SELECT 1 FROM project_items pi
    WHERE pi.project_id = 'fef05069-0001-4001-a000-000000000001'::uuid AND pi.product_id = p.id
  );

-- สาย AC YAZAKI IEC-01-6mm² × 100 เมตร — ซื้อเป็นม้วน 100m = 3,066/ม้วน → 30.66/ม.
INSERT INTO project_items (project_id, product_id, supplier_price_id, quantity, unit_price_snapshot)
SELECT
    'fef05069-0001-4001-a000-000000000001'::uuid,
    p.id,
    (SELECT sp.id FROM supplier_prices sp WHERE sp.product_id = p.id
     ORDER BY sp.price / p.units_per_purchase ASC LIMIT 1),
    100,
    ROUND(
        (SELECT sp.price FROM supplier_prices sp WHERE sp.product_id = p.id
         ORDER BY sp.price / p.units_per_purchase ASC LIMIT 1)
        / p.units_per_purchase,
        6
    )
FROM products p
WHERE p.model = 'THW-IEC01-6-B'
  AND NOT EXISTS (
    SELECT 1 FROM project_items pi
    WHERE pi.project_id = 'fef05069-0001-4001-a000-000000000001'::uuid AND pi.product_id = p.id
  );

-- Grounding System × 1 ชุด (5,000)
INSERT INTO project_items (project_id, product_id, supplier_price_id, quantity, unit_price_snapshot)
SELECT
    'fef05069-0001-4001-a000-000000000001'::uuid,
    p.id,
    (SELECT sp.id FROM supplier_prices sp WHERE sp.product_id = p.id ORDER BY sp.price ASC LIMIT 1),
    1,
    (SELECT sp.price FROM supplier_prices sp WHERE sp.product_id = p.id ORDER BY sp.price ASC LIMIT 1)
FROM products p
WHERE p.model = 'GROUND-ROD-2.4M'
  AND NOT EXISTS (
    SELECT 1 FROM project_items pi
    WHERE pi.project_id = 'fef05069-0001-4001-a000-000000000001'::uuid AND pi.product_id = p.id
  );

-- ชุดท่อร้อยสาย × 1 ชุด (5,500)
INSERT INTO project_items (project_id, product_id, supplier_price_id, quantity, unit_price_snapshot)
SELECT
    'fef05069-0001-4001-a000-000000000001'::uuid,
    p.id,
    (SELECT sp.id FROM supplier_prices sp WHERE sp.product_id = p.id ORDER BY sp.price ASC LIMIT 1),
    1,
    (SELECT sp.price FROM supplier_prices sp WHERE sp.product_id = p.id ORDER BY sp.price ASC LIMIT 1)
FROM products p
WHERE p.model = 'CONDUIT-IMC-LOT'
  AND NOT EXISTS (
    SELECT 1 FROM project_items pi
    WHERE pi.project_id = 'fef05069-0001-4001-a000-000000000001'::uuid AND pi.product_id = p.id
  );

-- อุปกรณ์เบ็ดเตล็ด × 1 ชุด (3,000)
INSERT INTO project_items (project_id, product_id, supplier_price_id, quantity, unit_price_snapshot)
SELECT
    'fef05069-0001-4001-a000-000000000001'::uuid,
    p.id,
    (SELECT sp.id FROM supplier_prices sp WHERE sp.product_id = p.id ORDER BY sp.price ASC LIMIT 1),
    1,
    (SELECT sp.price FROM supplier_prices sp WHERE sp.product_id = p.id ORDER BY sp.price ASC LIMIT 1)
FROM products p
WHERE p.model = 'MISC-SOLAR-LOT'
  AND NOT EXISTS (
    SELECT 1 FROM project_items pi
    WHERE pi.project_id = 'fef05069-0001-4001-a000-000000000001'::uuid AND pi.product_id = p.id
  );

-- บริการติดตั้ง 5 รายการ (รวม 37,500)
INSERT INTO project_items (project_id, product_id, supplier_price_id, quantity, unit_price_snapshot)
SELECT
    'fef05069-0001-4001-a000-000000000001'::uuid,
    p.id,
    (SELECT sp.id FROM supplier_prices sp WHERE sp.product_id = p.id ORDER BY sp.price ASC LIMIT 1),
    1,
    (SELECT sp.price FROM supplier_prices sp WHERE sp.product_id = p.id ORDER BY sp.price ASC LIMIT 1)
FROM products p
WHERE p.model IN ('INST-PANEL-MOUNT','INST-INVERTER-BAT','INST-DC-AC','INST-PERMIT','INST-COMMISSIONING')
  AND NOT EXISTS (
    SELECT 1 FROM project_items pi
    WHERE pi.project_id = 'fef05069-0001-4001-a000-000000000001'::uuid AND pi.product_id = p.id
  );
