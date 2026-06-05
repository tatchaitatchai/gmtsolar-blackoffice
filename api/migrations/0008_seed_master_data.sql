-- 0008_seed_master_data.sql
-- Seed brands, suppliers, products, and supplier_prices from receipts
-- All prices are pre-VAT, per use_unit (or per purchase_unit where applicable)

-- =====================================================
-- BRANDS
-- =====================================================
INSERT INTO brands (name) VALUES
    ('Deye'),
    ('SolarEdge'),
    ('JA Solar'),
    ('Longi'),
    ('YAZAKI'),
    ('LAPP'),
    ('Panasonic'),
    ('TDP'),
    ('ทั่วไป')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- SUPPLIERS
-- =====================================================
INSERT INTO suppliers (name, contact, note)
SELECT s.name, s.contact, s.note
FROM (VALUES
    ('บริษัทเมก้า อินดัสทรี (ประเทศไทย) จำกัด',    '034-110172',   'QT26-001/002/003 + catalog พ.ค. 2026'),
    ('Perfect Motion Systems',                          '085-364-0505', 'QT6904349 electrical panel components'),
    ('บริษัท บีเอสพีรีนิวเอเบิล เอ็นเนอร์ยี่ จำกัด', '094-675-0928', 'OA6904-040 solar mounting clamp'),
    ('The World Systems Engineering',                   '092-828-7171', 'QT2026-107/112 PV cable + MC4'),
    ('บริษัท ทริปเปิล ดี เพาเวอร์ จำกัด',           '096-826-4978', 'QT2026040127 PCW AC cable + lug'),
    ('บริษัท ศ.ศุภกิจวาณิชการไฟฟ้า จำกัด',          '081-906-8253', 'QT6904027 YAZAKI THW wire'),
    ('หสม. ซี.พี. แมกเนติค ชัพพลายส์',               '02-749-2495',  'OOQ6904000244/245/248/258 conduit + accessories')
) AS s(name, contact, note)
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = s.name);

-- =====================================================
-- PRODUCTS: อินเวอร์เตอร์ (Deye, เครื่อง)
-- =====================================================
INSERT INTO products (category_id, brand_id, name, model, spec, use_unit)
SELECT
    (SELECT id FROM categories WHERE name = 'อินเวอร์เตอร์'),
    (SELECT id FROM brands WHERE name = 'Deye'),
    p.name, p.model, p.spec::jsonb, 'เครื่อง'
FROM (VALUES
    ('อินเวอร์เตอร์ Deye 20kW 3P Hybrid', 'SUN-20K-SG05LP3-EU-SM2', '{"power_kw":20,"phase":3,"type":"hybrid"}'),
    ('อินเวอร์เตอร์ Deye 10kW 3P Hybrid', 'SUN-10K-SG04LP3-EU',      '{"power_kw":10,"phase":3,"type":"hybrid"}'),
    ('อินเวอร์เตอร์ Deye 10kW 1P Hybrid', 'SUN-10K-SG02LP1-EU-AM3',  '{"power_kw":10,"phase":1,"type":"hybrid"}'),
    ('อินเวอร์เตอร์ Deye 6kW 1P Hybrid',  'SUN-6K-SG04LP1-EU-SM2',   '{"power_kw":6,"phase":1,"type":"hybrid"}'),
    ('อินเวอร์เตอร์ Deye 5kW 3P Hybrid',  'SUN-5K-SG05LP3-EU-SM2',   '{"power_kw":5,"phase":3,"type":"hybrid"}'),
    ('อินเวอร์เตอร์ Deye 5kW 1P Hybrid',  'SUN-5K-SG04LP1-EU-SM2',   '{"power_kw":5,"phase":1,"type":"hybrid"}')
) AS p(name, model, spec)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE model = p.model);

-- =====================================================
-- PRODUCTS: แบตเตอรี่ (SolarEdge, ชุด)
-- =====================================================
INSERT INTO products (category_id, brand_id, name, model, spec, use_unit)
SELECT
    (SELECT id FROM categories WHERE name = 'แบตเตอรี่'),
    (SELECT id FROM brands WHERE name = 'SolarEdge'),
    p.name, p.model, p.spec::jsonb, 'ชุด'
FROM (VALUES
    ('แบตเตอรี่ SolarEdge SE-F16 LV 16kWh',   'SE-F16-LV', '{"capacity_kwh":16,"voltage":"LV"}'),
    ('แบตเตอรี่ SolarEdge SE-F12 LV 11.8kWh',  'SE-F12-LV', '{"capacity_kwh":11.8,"voltage":"LV"}')
) AS p(name, model, spec)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE model = p.model);

-- =====================================================
-- PRODUCTS: โซล่าเซลล์ (แผง)
-- =====================================================
INSERT INTO products (category_id, brand_id, name, model, spec, use_unit)
SELECT
    (SELECT id FROM categories WHERE name = 'โซล่าเซลล์'),
    (SELECT id FROM brands WHERE name = p.brand),
    p.name, p.model, p.spec::jsonb, 'แผง'
FROM (VALUES
    ('JA Solar',  'โซล่าเซลล์ JA Solar 635W Mono Perc', '635W-MONO',   '{"wattage_w":635,"type":"Mono Perc"}'),
    ('Longi',     'โซล่าเซลล์ Longi 645W HIMO X9',       '645W-HIMOX9', '{"wattage_w":645,"type":"HIMO X9"}')
) AS p(brand, name, model, spec)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE model = p.model);

-- =====================================================
-- PRODUCTS: โครงยึด (ทั่วไป)
-- =====================================================
INSERT INTO products (category_id, brand_id, name, model, spec, use_unit)
SELECT
    (SELECT id FROM categories WHERE name = 'โครงยึด'),
    (SELECT id FROM brands WHERE name = 'ทั่วไป'),
    p.name, p.model, p.spec::jsonb, p.use_unit
FROM (VALUES
    ('ขายึดหลังคาซีแพคแผ่นลอน (แบบปรับระดับได้)', 'KL-CP-01-B', '{"type":"adjustable_hook","roof":"cpac"}', 'ชุด')
) AS p(name, model, spec, use_unit)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE model = p.model);

-- =====================================================
-- PRODUCTS: สายไฟ PV DC (ทั่วไป, เมตร, ซื้อเป็นกล่อง 100m)
-- =====================================================
INSERT INTO products (category_id, brand_id, name, model, spec, use_unit, purchase_unit, units_per_purchase)
SELECT
    (SELECT id FROM categories WHERE name = 'สายไฟ'),
    (SELECT id FROM brands WHERE name = 'ทั่วไป'),
    p.name, p.model, p.spec::jsonb, 'เมตร', 'กล่อง', 100
FROM (VALUES
    ('PV Solar Cable 4mm² สีแดง',  'PV-4MM-RED',   '{"size_mm2":4,"color":"red","type":"PV solar"}'),
    ('PV Solar Cable 6mm² สีดำ',   'PV-6MM-BLACK', '{"size_mm2":6,"color":"black","type":"PV solar"}'),
    ('PV Solar Cable 6mm² สีแดง',  'PV-6MM-RED',   '{"size_mm2":6,"color":"red","type":"PV solar"}')
) AS p(name, model, spec)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE model = p.model);

-- =====================================================
-- PRODUCTS: สายไฟ AC PCW (TDP, เมตร)
-- =====================================================
INSERT INTO products (category_id, brand_id, name, model, spec, use_unit)
SELECT
    (SELECT id FROM categories WHERE name = 'สายไฟ'),
    (SELECT id FROM brands WHERE name = 'TDP'),
    p.name, p.model, p.spec::jsonb, 'เมตร'
FROM (VALUES
    ('TDP Premium Cable PCW 35mm² สีดำ', 'PCW-35-BLACK', '{"size_mm2":35,"color":"black","type":"PCW","rating":"0.6/1kV"}'),
    ('TDP Premium Cable PCW 35mm² สีแดง', 'PCW-35-RED',  '{"size_mm2":35,"color":"red","type":"PCW","rating":"0.6/1kV"}'),
    ('TDP Premium Cable PCW 50mm² สีดำ', 'PCW-50-BLACK', '{"size_mm2":50,"color":"black","type":"PCW","rating":"0.6/1kV"}'),
    ('TDP Premium Cable PCW 50mm² สีแดง', 'PCW-50-RED',  '{"size_mm2":50,"color":"red","type":"PCW","rating":"0.6/1kV"}')
) AS p(name, model, spec)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE model = p.model);

-- =====================================================
-- PRODUCTS: สายไฟ THW YAZAKI (เมตร, ซื้อเป็นม้วน 100m)
-- =====================================================
INSERT INTO products (category_id, brand_id, name, model, spec, use_unit, purchase_unit, units_per_purchase)
SELECT
    (SELECT id FROM categories WHERE name = 'สายไฟ'),
    (SELECT id FROM brands WHERE name = 'YAZAKI'),
    p.name, p.model, p.spec::jsonb, 'เมตร', 'ม้วน', 100
FROM (VALUES
    ('YAZAKI THW 1.5mm² G/Y (IEC01)',    'THW-IEC01-1.5-GY', '{"size_mm2":1.5,"color":"G/Y","standard":"IEC01","type":"THW"}'),
    ('YAZAKI THW 4mm² G/Y (IEC01)',      'THW-IEC01-4-GY',   '{"size_mm2":4,"color":"G/Y","standard":"IEC01","type":"THW"}'),
    ('YAZAKI THW 6mm² G/Y (IEC01)',      'THW-IEC01-6-GY',   '{"size_mm2":6,"color":"G/Y","standard":"IEC01","type":"THW"}'),
    ('YAZAKI THW 4mm² สีน้ำตาล (IEC01)', 'THW-IEC01-4-BR',  '{"size_mm2":4,"color":"BR","standard":"IEC01","type":"THW"}'),
    ('YAZAKI THW 4mm² สีฟ้า (IEC01)',    'THW-IEC01-4-LB',   '{"size_mm2":4,"color":"LB","standard":"IEC01","type":"THW"}'),
    ('YAZAKI THW 6mm² สีดำ (IEC01)',     'THW-IEC01-6-B',    '{"size_mm2":6,"color":"B","standard":"IEC01","type":"THW"}'),
    ('YAZAKI THW 10mm² สีดำ (IEC01)',    'THW-IEC01-10-B',   '{"size_mm2":10,"color":"B","standard":"IEC01","type":"THW"}'),
    ('YAZAKI THW(F) 2.5mm² G/Y (IEC02)', 'THW-IEC02-2.5-GY','{"size_mm2":2.5,"color":"G/Y","standard":"IEC02","type":"THW(F)"}'),
    ('YAZAKI THW(F) 4mm² G/Y (IEC02)',   'THW-IEC02-4-GY',   '{"size_mm2":4,"color":"G/Y","standard":"IEC02","type":"THW(F)"}'),
    ('YAZAKI THW(F) 6mm² G/Y (IEC02)',   'THW-IEC02-6-GY',   '{"size_mm2":6,"color":"G/Y","standard":"IEC02","type":"THW(F)"}'),
    ('YAZAKI THW(F) 6mm² สีดำ (IEC02)', 'THW-IEC02-6-B',    '{"size_mm2":6,"color":"B","standard":"IEC02","type":"THW(F)"}'),
    ('YAZAKI THW(F) 10mm² สีดำ (IEC02)','THW-IEC02-10-B',   '{"size_mm2":10,"color":"B","standard":"IEC02","type":"THW(F)"}')
) AS p(name, model, spec)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE model = p.model);

-- =====================================================
-- PRODUCTS: สายไฟ LIYCY LAPP (เมตร, ซื้อเป็นม้วน 100m)
-- =====================================================
INSERT INTO products (category_id, brand_id, name, model, spec, use_unit, purchase_unit, units_per_purchase)
SELECT
    (SELECT id FROM categories WHERE name = 'สายไฟ'),
    (SELECT id FROM brands WHERE name = 'LAPP'),
    'LAPP LIYCY 2x0.75mm² Control Cable', 'LIYCY-2X0.75',
    '{"cores":2,"size_mm2":0.75,"type":"LIYCY"}'::jsonb, 'เมตร', 'ม้วน', 100
WHERE NOT EXISTS (SELECT 1 FROM products WHERE model = 'LIYCY-2X0.75');

-- =====================================================
-- PRODUCTS: สายไฟ VCT-G (ทั่วไป, เมตร)
-- =====================================================
INSERT INTO products (category_id, brand_id, name, model, spec, use_unit)
SELECT
    (SELECT id FROM categories WHERE name = 'สายไฟ'),
    (SELECT id FROM brands WHERE name = 'ทั่วไป'),
    'VCT-G 2x6mm²', 'VCTG-2X6', '{"cores":2,"size_mm2":6,"type":"VCT-G"}'::jsonb, 'เมตร'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE model = 'VCTG-2X6');

-- =====================================================
-- PRODUCTS: อุปกรณ์เสริม - MC4 Connector
-- =====================================================
INSERT INTO products (category_id, brand_id, name, model, spec, use_unit)
SELECT
    (SELECT id FROM categories WHERE name = 'อุปกรณ์เสริม'),
    (SELECT id FROM brands WHERE name = 'ทั่วไป'),
    'MC4 Connector (คู่/เซ็ต)', 'MC4-SET', '{"type":"MC4 solar connector","per_set":2}'::jsonb, 'เซ็ต'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE model = 'MC4-SET');

-- =====================================================
-- PRODUCTS: อุปกรณ์เสริม - ท่อ IMC Panasonic
-- =====================================================
INSERT INTO products (category_id, brand_id, name, model, spec, use_unit)
SELECT
    (SELECT id FROM categories WHERE name = 'อุปกรณ์เสริม'),
    (SELECT id FROM brands WHERE name = 'Panasonic'),
    p.name, p.model, p.spec::jsonb, p.use_unit
FROM (VALUES
    ('ท่อหนา IMC 3/4"',                'IMC-34-3M',       '{"size":"3/4in","length_m":3,"type":"IMC rigid"}',       'เส้น'),
    ('ท่อหนา IMC 1/2"',                'IMC-12-3M',       '{"size":"1/2in","length_m":3,"type":"IMC rigid"}',       'เส้น'),
    ('คูปิ้งหนา IMC 3/4"',             'IMC-COUP-34',     '{"size":"3/4in","type":"IMC coupling"}',                 'ตัว'),
    ('คูปิ้งหนา IMC 1/2"',             'IMC-COUP-12',     '{"size":"1/2in","type":"IMC coupling"}',                 'ตัว'),
    ('โค้งหนา IMC 3/4"',               'IMC-ELBOW-34',    '{"size":"3/4in","type":"IMC elbow"}',                    'ตัว'),
    ('โค้งหนา IMC 1/2"',               'IMC-ELBOW-12',    '{"size":"1/2in","type":"IMC elbow"}',                    'ตัว'),
    ('คอนเนคเตอร์ FLEX กันน้ำ 3/4"',  'FLEX-CONN-34',    '{"size":"3/4in","type":"flex connector waterproof"}',   'ตัว'),
    ('คอนเนคเตอร์ FLEX กันน้ำ 1/2"',  'FLEX-CONN-12',    '{"size":"1/2in","type":"flex connector waterproof"}',   'ตัว')
) AS p(name, model, spec, use_unit)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE model = p.model);

-- =====================================================
-- PRODUCTS: อุปกรณ์เสริม - แคล้มปลา, ท่ออ่อน, รางC (ทั่วไป)
-- =====================================================
INSERT INTO products (category_id, brand_id, name, model, spec, use_unit)
SELECT
    (SELECT id FROM categories WHERE name = 'อุปกรณ์เสริม'),
    (SELECT id FROM brands WHERE name = 'ทั่วไป'),
    p.name, p.model, p.spec::jsonb, p.use_unit
FROM (VALUES
    ('แคล้มปลา C IMC 3/4"',               'CLAMP-C-34',      '{"size":"3/4in","type":"C clamp for IMC"}',             'คู่'),
    ('แคล้มปลา C IMC 1/2"',               'CLAMP-C-12',      '{"size":"1/2in","type":"C clamp for IMC"}',             'คู่'),
    ('ท่ออ่อนกันน้ำ 3/4" (100ft/กล่อง)', 'FLEX-34-BOX',     '{"size":"3/4in","feet_per_box":100,"type":"liquidtight"}','กล่อง'),
    ('ท่ออ่อนกันน้ำ 1/2" (200ft/กล่อง)', 'FLEX-12-BOX',     '{"size":"1/2in","feet_per_box":200,"type":"liquidtight"}','กล่อง'),
    ('รางC ตื้น 25x40x1200mm',            'CDUCT-25X40',     '{"w_mm":25,"h_mm":40,"l_mm":1200,"type":"C duct"}',     'เส้น'),
    ('พูลบ็อกเหล็ก 6x6x4 นิ้ว',          'PULLBOX-6X6X4',   '{"size":"6x6x4in","type":"steel pull box"}',            'ใบ'),
    ('รางเหล็ก 2x3x8ฟุต',                'TRAY-2X3X8',      '{"w_in":2,"h_in":3,"l_ft":8,"type":"steel cable tray"}','ชุด'),
    ('ข้องอ 2x3" เป็ดบน',                'TRAY-ELBOW-2X3',  '{"size":"2x3in","type":"tray elbow up"}',               'ตัว'),
    ('สามทาง 2x3"',                       'TRAY-TEE-2X3',    '{"size":"2x3in","type":"tray tee"}',                    'ตัว')
) AS p(name, model, spec, use_unit)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE model = p.model);

-- =====================================================
-- PRODUCTS: อุปกรณ์เสริม - บุชชิ่ง ล็อคนัท อิริค (ทั่วไป)
-- =====================================================
INSERT INTO products (category_id, brand_id, name, model, spec, use_unit)
SELECT
    (SELECT id FROM categories WHERE name = 'อุปกรณ์เสริม'),
    (SELECT id FROM brands WHERE name = 'ทั่วไป'),
    p.name, p.model, p.spec::jsonb, 'ตัว'
FROM (VALUES
    ('บุชชิ่ง 1/2"',    'BUSHING-12',     '{"size":"1/2in","type":"bushing"}'),
    ('บุชชิ่ง 3/4"',    'BUSHING-34',     '{"size":"3/4in","type":"bushing"}'),
    ('ล็อคนัท 1/2"',   'LOCKNUT-12',     '{"size":"1/2in","type":"locknut"}'),
    ('ล็อคนัท 3/4"',   'LOCKNUT-34',     '{"size":"3/4in","type":"locknut"}'),
    ('อิริคสั้น 1/2"',  'ERICK-SHORT-12', '{"size":"1/2in","type":"short eric"}'),
    ('อิริคสั้น 3/4"',  'ERICK-SHORT-34', '{"size":"3/4in","type":"short eric"}')
) AS p(name, model, spec)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE model = p.model);

-- =====================================================
-- PRODUCTS: อุปกรณ์เสริม - ห่วงปลา / ปลอกยาง (TDP)
-- =====================================================
INSERT INTO products (category_id, brand_id, name, model, spec, use_unit)
SELECT
    (SELECT id FROM categories WHERE name = 'อุปกรณ์เสริม'),
    (SELECT id FROM brands WHERE name = 'TDP'),
    p.name, p.model, p.spec::jsonb, 'ชิ้น'
FROM (VALUES
    ('ห่วงปลา Cable Lug SC35-8',  'LUG-SC35-8',  '{"cable_mm2":35,"bolt_mm":8,"type":"copper lug"}'),
    ('ห่วงปลา Cable Lug SC50-8',  'LUG-SC50-8',  '{"cable_mm2":50,"bolt_mm":8,"type":"copper lug"}'),
    ('ปลอกยางหางปลา V38',        'RUBBER-V38',  '{"fit":"SC35","type":"cable lug end cap","size":"V38"}'),
    ('ปลอกยางหางปลา V60',        'RUBBER-V60',  '{"fit":"SC50","type":"cable lug end cap","size":"V60"}')
) AS p(name, model, spec)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE model = p.model);

-- =====================================================
-- PRODUCTS: อุปกรณ์เสริม - Electrical Panel (Perfect Motion, ชิ้น)
-- =====================================================
INSERT INTO products (category_id, brand_id, name, model, spec, use_unit)
SELECT
    (SELECT id FROM categories WHERE name = 'อุปกรณ์เสริม'),
    (SELECT id FROM brands WHERE name = 'ทั่วไป'),
    p.name, p.model, p.spec::jsonb, p.use_unit
FROM (VALUES
    ('Combiner Box 24 Way FHVB',       'FHVB-24WAY',    '{"type":"combiner box","ways":24}',                           'ชิ้น'),
    ('Fuse 20A 1000VDC (FDS-32)',       'FDS-32',        '{"rating_a":20,"voltage":"1000VDC","type":"fuse"}',           'ชิ้น'),
    ('DC Fuse Holder 1000VDC (FDS-32B)','FDS-32B',       '{"voltage":"1000VDC","type":"fuse holder"}',                  'ชิ้น'),
    ('DC MCB 2P 20A 800VDC (FPV-63)',   'FPV-63',        '{"poles":2,"rating_a":20,"voltage":"800VDC","type":"DC MCB"}','ชิ้น'),
    ('DC Surge 2P 800VDC (FSP-D40)',    'FSP-D40',       '{"poles":2,"voltage":"800VDC","type":"DC surge"}',            'ชิ้น'),
    ('AC Surge 2P 275VAC (FSP-A40)',    'FSP-A40-2P',    '{"poles":2,"voltage":"275VAC","type":"AC surge"}',            'ชิ้น'),
    ('DC MCCB 2P 160A 550V (FPVM-250)','FPVM-250',       '{"poles":2,"rating_a":160,"voltage":"550V","type":"DC MCCB"}','ชิ้น'),
    ('MCB RCBO 4P 32A 100mA (FLCB-63)','FLCB-63',        '{"poles":4,"rating_a":32,"ma":100,"type":"RCBO"}',           'ชิ้น'),
    ('AC Surge 4P 385VAC (FSP-A40)',    'FSP-A40-4P',    '{"poles":4,"voltage":"385VAC","type":"AC surge"}',            'ชิ้น'),
    ('AC MCB 4P 32A 400VAC (FE7-63)',   'FE7-63',        '{"poles":4,"rating_a":32,"voltage":"400VAC","type":"AC MCB"}','ชิ้น'),
    ('ATS 4P 63A 400VAC (FTS-63)',      'FTS-63',        '{"poles":4,"rating_a":63,"voltage":"400VAC","type":"ATS"}',   'ชิ้น'),
    ('DIN Rail รางปีกนก C45',          'DINRAIL-C45',   '{"type":"DIN rail C45"}',                                     'เมตร'),
    ('Terminal UK-6N 6mm² 800V',        'UK-6N',         '{"size_mm2":6,"voltage":"800V","type":"terminal"}',           'ชิ้น'),
    ('Terminal TBR-30 (สีดำ)',          'TBR-30',        '{"type":"terminal block","color":"black"}',                   'ชิ้น'),
    ('บาร์กราวด์ XP0609D-10P',         'XP0609D-10P',   '{"type":"ground bar","poles":10}',                            'ตัว'),
    ('เคเบิ้ลแกลน PG36',               'PG36',          '{"type":"cable gland","size":"PG36"}',                        'ชิ้น'),
    ('PVC Wireduct 60x40mm 2M (สีเทา)', 'WIREDUCT-60X40','{"w_mm":40,"h_mm":60,"l_m":2,"color":"gray"}',              'เส้น'),
    ('PVC Wireduct 40x40mm 2M (สีเทา)', 'WIREDUCT-40X40','{"w_mm":40,"h_mm":40,"l_m":2,"color":"gray"}',              'เส้น')
) AS p(name, model, spec, use_unit)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE model = p.model);

-- =====================================================
-- PRODUCTS: อุปกรณ์เสริม - หางปลา / ferrule (ชิ้น, ซื้อเป็นชุด)
-- =====================================================
INSERT INTO products (category_id, brand_id, name, model, spec, use_unit, purchase_unit, units_per_purchase)
SELECT
    (SELECT id FROM categories WHERE name = 'อุปกรณ์เสริม'),
    (SELECT id FROM brands WHERE name = 'ทั่วไป'),
    p.name, p.model, p.spec::jsonb, 'ชิ้น', 'ชุด', p.pcs::numeric
FROM (VALUES
    ('หางปลาแบบเปลือย C45-10',       'LUG-C45-10',  '{"size_mm2":10,"type":"bare ferrule"}',               100),
    ('หางปลาแบบเปลือย C45-6',        'LUG-C45-6',   '{"size_mm2":6,"type":"bare ferrule"}',                100),
    ('หางปลาแบบเปลือย C45-4',        'LUG-C45-4',   '{"size_mm2":4,"type":"bare ferrule"}',                100),
    ('หางปลาแบบเปลือย C45-2.5',      'LUG-C45-2.5', '{"size_mm2":2.5,"type":"bare ferrule"}',              100),
    ('หางปลา TE6-014 สีเหลือง',      'LUG-TE6-014', '{"size_mm2":6,"type":"insulated ferrule","color":"yellow"}', 50),
    ('หางปลา TE4-009 สีเหลือง',      'LUG-TE4-009', '{"size_mm2":4,"type":"insulated ferrule","color":"yellow"}', 100),
    ('หางปลา E6012 สีเหลือง',        'LUG-E6012',   '{"size_mm2":6,"type":"insulated ferrule","color":"yellow"}', 100),
    ('หางปลา E4009 สีเหลือง',        'LUG-E4009',   '{"size_mm2":4,"type":"insulated ferrule","color":"yellow"}', 100),
    ('หางปลา E2508 สีเหลือง',        'LUG-E2508',   '{"size_mm2":2.5,"type":"insulated ferrule","color":"yellow"}',100),
    ('หางปลา E1008 สีแดง',           'LUG-E1008',   '{"size_mm2":1,"type":"insulated ferrule","color":"red"}',    100)
) AS p(name, model, spec, pcs)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE model = p.model);

-- =====================================================
-- SUPPLIER PRICES: บริษัทเมก้า อินดัสทรี
-- ราคาต่อเครื่อง/ชุด/แผง (ไม่มี purchase_unit)
-- =====================================================
INSERT INTO supplier_prices (product_id, supplier_id, price, note, effective_date)
SELECT p.id, s.id, pr.price, pr.note, pr.eff::date
FROM (VALUES
    ('SUN-20K-SG05LP3-EU-SM2',  85500.00, 'MEGA catalog พ.ค. 2026',    '2026-05-05'),
    ('SUN-10K-SG04LP3-EU',      54991.00, 'QT26-001 actual',            '2026-04-01'),
    ('SUN-10K-SG02LP1-EU-AM3',  48650.00, 'MEGA catalog พ.ค. 2026',    '2026-05-05'),
    ('SUN-6K-SG04LP1-EU-SM2',   25204.00, 'MEGA catalog พ.ค. 2026',    '2026-05-05'),
    ('SUN-5K-SG05LP3-EU-SM2',   47600.00, 'QT26-003 actual',            '2026-04-01'),
    ('SUN-5K-SG04LP1-EU-SM2',   24288.00, 'MEGA catalog พ.ค. 2026',    '2026-05-05'),
    ('SE-F16-LV',               57000.00, 'MEGA catalog พ.ค. 2026',    '2026-05-05'),
    ('SE-F12-LV',               44000.00, 'QT26-002 actual',            '2026-04-01'),
    ('SE-F12-LV',               48500.00, 'MEGA catalog พ.ค. 2026',    '2026-05-05'),
    ('635W-MONO',                2660.00, 'QT26-002 actual',            '2026-04-01'),
    ('645W-HIMOX9',              2740.00, 'MEGA catalog พ.ค. 2026',    '2026-05-05')
) AS pr(model, price, note, eff)
JOIN products p ON p.model = pr.model
JOIN suppliers s ON s.name = 'บริษัทเมก้า อินดัสทรี (ประเทศไทย) จำกัด'
WHERE NOT EXISTS (
    SELECT 1 FROM supplier_prices sp
    WHERE sp.product_id = p.id AND sp.supplier_id = s.id AND sp.note = pr.note
);

-- =====================================================
-- SUPPLIER PRICES: BSP Solar
-- ราคาต่อ ชุด ขายึดหลังคา
-- =====================================================
INSERT INTO supplier_prices (product_id, supplier_id, price, note, effective_date)
SELECT p.id, s.id, 100.93, 'OA6904-040 actual', '2026-04-30'
FROM products p, suppliers s
WHERE p.model = 'KL-CP-01-B'
  AND s.name = 'บริษัท บีเอสพีรีนิวเอเบิล เอ็นเนอร์ยี่ จำกัด'
  AND NOT EXISTS (
      SELECT 1 FROM supplier_prices sp
      WHERE sp.product_id = p.id AND sp.supplier_id = s.id AND sp.note = 'OA6904-040 actual'
  );

-- =====================================================
-- SUPPLIER PRICES: The World Systems Engineering
-- สาย PV ราคาต่อ กล่อง (100m); MC4 ราคาต่อ เซ็ต
-- =====================================================
INSERT INTO supplier_prices (product_id, supplier_id, price, note, effective_date)
SELECT p.id, s.id, pr.price, pr.note, pr.eff::date
FROM (VALUES
    ('PV-4MM-RED',   2225.00, 'QT2026-107-R1 per กล่อง 100m', '2026-04-24'),
    ('PV-6MM-BLACK', 3325.00, 'QT2026-112 per กล่อง 100m',    '2026-04-28'),
    ('PV-6MM-RED',   3335.00, 'QT2026-112 per กล่อง 100m',    '2026-04-28'),
    ('MC4-SET',        31.00, 'QT2026-107-R1 per เซ็ต',       '2026-04-24')
) AS pr(model, price, note, eff)
JOIN products p ON p.model = pr.model
JOIN suppliers s ON s.name = 'The World Systems Engineering'
WHERE NOT EXISTS (
    SELECT 1 FROM supplier_prices sp
    WHERE sp.product_id = p.id AND sp.supplier_id = s.id AND sp.note = pr.note
);

-- =====================================================
-- SUPPLIER PRICES: TDP Triple D Power
-- สาย PCW per เมตร; ห่วงปลา/ปลอกยาง per ชิ้น
-- =====================================================
INSERT INTO supplier_prices (product_id, supplier_id, price, note, effective_date)
SELECT p.id, s.id, pr.price, pr.note, pr.eff::date
FROM (VALUES
    ('PCW-35-BLACK', 275.00, 'QT2026040127 per เมตร', '2026-04-17'),
    ('PCW-35-RED',   275.00, 'QT2026040127 per เมตร', '2026-04-17'),
    ('PCW-50-BLACK', 360.00, 'QT2026040127 per เมตร', '2026-04-17'),
    ('PCW-50-RED',   360.00, 'QT2026040127 per เมตร', '2026-04-17'),
    ('LUG-SC35-8',    20.00, 'QT2026040127 per ชิ้น', '2026-04-17'),
    ('LUG-SC50-8',    28.00, 'QT2026040127 per ชิ้น', '2026-04-17'),
    ('RUBBER-V38',     3.00, 'QT2026040127 per ชิ้น', '2026-04-17'),
    ('RUBBER-V60',     3.00, 'QT2026040127 per ชิ้น', '2026-04-17')
) AS pr(model, price, note, eff)
JOIN products p ON p.model = pr.model
JOIN suppliers s ON s.name = 'บริษัท ทริปเปิล ดี เพาเวอร์ จำกัด'
WHERE NOT EXISTS (
    SELECT 1 FROM supplier_prices sp
    WHERE sp.product_id = p.id AND sp.supplier_id = s.id AND sp.note = pr.note
);

-- =====================================================
-- SUPPLIER PRICES: ส.ศุภกิจ (YAZAKI THW)
-- ราคาต่อ ม้วน 100m (pre-discount, as billed)
-- =====================================================
INSERT INTO supplier_prices (product_id, supplier_id, price, note, effective_date)
SELECT p.id, s.id, pr.price, pr.note, pr.eff::date
FROM (VALUES
    ('THW-IEC01-1.5-GY',   838.00, 'QT6904027 per ม้วน 100m', '2026-04-16'),
    ('THW-IEC01-4-GY',    2015.00, 'QT6904027 per ม้วน 100m', '2026-04-16'),
    ('THW-IEC01-6-GY',    3066.00, 'QT6904027 per ม้วน 100m', '2026-04-16'),
    ('THW-IEC01-4-BR',    2015.00, 'QT6904027 per ม้วน 100m', '2026-04-16'),
    ('THW-IEC01-4-LB',    2015.00, 'QT6904027 per ม้วน 100m', '2026-04-16'),
    ('THW-IEC01-6-B',     3066.00, 'QT6904027 per ม้วน 100m', '2026-04-16'),
    ('THW-IEC01-10-B',    5038.00, 'QT6904027 per ม้วน 100m', '2026-04-16'),
    ('THW-IEC02-2.5-GY',  1714.00, 'QT6904027 per ม้วน 100m', '2026-04-16'),
    ('THW-IEC02-4-GY',    2568.00, 'QT6904027 per ม้วน 100m', '2026-04-16'),
    ('THW-IEC02-6-GY',    4439.00, 'QT6904027 per ม้วน 100m', '2026-04-16'),
    ('THW-IEC02-6-B',     4439.00, 'QT6904027 per ม้วน 100m', '2026-04-16'),
    ('THW-IEC02-10-B',    7111.00, 'QT6904027 per ม้วน 100m', '2026-04-16')
) AS pr(model, price, note, eff)
JOIN products p ON p.model = pr.model
JOIN suppliers s ON s.name = 'บริษัท ศ.ศุภกิจวาณิชการไฟฟ้า จำกัด'
WHERE NOT EXISTS (
    SELECT 1 FROM supplier_prices sp
    WHERE sp.product_id = p.id AND sp.supplier_id = s.id AND sp.note = pr.note
);

-- =====================================================
-- SUPPLIER PRICES: C.P. Magnetic — OOQ6904000244 (conduit)
-- ราคาหลังหักส่วนลด = Amount ÷ Qty
-- =====================================================
INSERT INTO supplier_prices (product_id, supplier_id, price, note, effective_date)
SELECT p.id, s.id, pr.price, pr.note, pr.eff::date
FROM (VALUES
    ('IMC-34-3M',      218.00, 'OOQ6904000244 per เส้น (disc. 50%)',        '2026-04-22'),
    ('IMC-12-3M',      164.00, 'OOQ6904000244 per เส้น (disc. 50%)',        '2026-04-22'),
    ('IMC-COUP-34',     14.49, 'OOQ6904000244 per ตัว (disc. 30%+10%)',     '2026-04-22'),
    ('IMC-COUP-12',     11.34, 'OOQ6904000244 per ตัว (disc. 30%+10%)',     '2026-04-22'),
    ('IMC-ELBOW-34',    32.76, 'OOQ6904000244 per ตัว (disc. 30%+10%)',     '2026-04-22'),
    ('IMC-ELBOW-12',    26.46, 'OOQ6904000244 per ตัว (disc. 30%+10%)',     '2026-04-22'),
    ('FLEX-34-BOX',   1140.00, 'OOQ6904000244 per กล่อง 100ft (disc. 60%+5%)','2026-04-22'),
    ('FLEX-12-BOX',   1748.00, 'OOQ6904000244 per กล่อง 200ft (disc. 60%+5%)','2026-04-22'),
    ('CLAMP-C-34',       4.32, 'OOQ6904000244 per คู่ (disc. 30%+5%)',      '2026-04-22'),
    ('CLAMP-C-12',       3.66, 'OOQ6904000244 per คู่ (disc. 30%+5%)',      '2026-04-22'),
    ('CDUCT-25X40',     65.00, 'OOQ6904000244 per เส้น',                    '2026-04-22'),
    ('FLEX-CONN-34',    26.60, 'OOQ6904000244 per ตัว (disc. 30%+5%)',      '2026-04-22'),
    ('FLEX-CONN-12',    19.95, 'OOQ6904000244 per ตัว (disc. 30%+5%)',      '2026-04-22')
) AS pr(model, price, note, eff)
JOIN products p ON p.model = pr.model
JOIN suppliers s ON s.name = 'หสม. ซี.พี. แมกเนติค ชัพพลายส์'
WHERE NOT EXISTS (
    SELECT 1 FROM supplier_prices sp
    WHERE sp.product_id = p.id AND sp.supplier_id = s.id AND sp.note = pr.note
);

-- =====================================================
-- SUPPLIER PRICES: C.P. Magnetic — OOQ6904000245/248 + 258
-- =====================================================
INSERT INTO supplier_prices (product_id, supplier_id, price, note, effective_date)
SELECT p.id, s.id, pr.price, pr.note, pr.eff::date
FROM (VALUES
    ('BUSHING-12',      2.34, 'OOQ6904000245 per ตัว (disc. 20%+10%)',   '2026-04-22'),
    ('BUSHING-34',      3.06, 'OOQ6904000245 per ตัว (disc. 20%+10%)',   '2026-04-22'),
    ('LOCKNUT-12',      1.98, 'OOQ6904000245 per ตัว (disc. 20%+10%)',   '2026-04-22'),
    ('LOCKNUT-34',      2.52, 'OOQ6904000245 per ตัว (disc. 20%+10%)',   '2026-04-22'),
    ('ERICK-SHORT-12', 43.20, 'OOQ6904000245 per ตัว (disc. 20%+10%)',   '2026-04-22'),
    ('ERICK-SHORT-34', 54.00, 'OOQ6904000245 per ตัว (disc. 20%+10%)',   '2026-04-22'),
    ('PULLBOX-6X6X4',  63.00, 'OOQ6904000245/248 per ใบ (disc. 10%)',    '2026-04-22'),
    ('TRAY-2X3X8',    290.33, 'OOQ6904000245/248 per ชุด (disc. 25%+2%)','2026-04-22'),
    ('TRAY-ELBOW-2X3',147.00, 'OOQ6904000245 per ตัว (disc. 25%+2%)',   '2026-04-22'),
    ('TRAY-TEE-2X3',  249.90, 'OOQ6904000245 per ตัว (disc. 25%+2%)',   '2026-04-22'),
    ('VCTG-2X6',      205.66, 'OOQ6904000245 per เมตร',                  '2026-04-22'),
    ('LIYCY-2X0.75',  3900.00,'OOQ6904000258 per ม้วน 100m (disc. 40%)', '2026-04-23')
) AS pr(model, price, note, eff)
JOIN products p ON p.model = pr.model
JOIN suppliers s ON s.name = 'หสม. ซี.พี. แมกเนติค ชัพพลายส์'
WHERE NOT EXISTS (
    SELECT 1 FROM supplier_prices sp
    WHERE sp.product_id = p.id AND sp.supplier_id = s.id AND sp.note = pr.note
);

-- =====================================================
-- SUPPLIER PRICES: Perfect Motion Systems (QT6904349)
-- หางปลา: ราคาต่อ ชุด (purchase_unit); อื่นๆ: ต่อ ชิ้น/เมตร
-- =====================================================
INSERT INTO supplier_prices (product_id, supplier_id, price, note, effective_date)
SELECT p.id, s.id, pr.price, pr.note, pr.eff::date
FROM (VALUES
    ('FHVB-24WAY',    1300.00, 'QT6904349 per ชิ้น', '2026-04-21'),
    ('FDS-32',          66.00, 'QT6904349 per ชิ้น', '2026-04-21'),
    ('FDS-32B',         66.00, 'QT6904349 per ชิ้น', '2026-04-21'),
    ('FPV-63',         420.00, 'QT6904349 per ชิ้น', '2026-04-21'),
    ('FSP-D40',        700.00, 'QT6904349 per ชิ้น', '2026-04-21'),
    ('FSP-A40-2P',     360.00, 'QT6904349 per ชิ้น', '2026-04-21'),
    ('FPVM-250',      1800.00, 'QT6904349 per ชิ้น', '2026-04-21'),
    ('FLCB-63',        700.00, 'QT6904349 per ชิ้น', '2026-04-21'),
    ('FSP-A40-4P',     570.00, 'QT6904349 per ชิ้น', '2026-04-21'),
    ('FE7-63',         280.00, 'QT6904349 per ชิ้น', '2026-04-21'),
    ('FTS-63',        1300.00, 'QT6904349 per ชิ้น', '2026-04-21'),
    ('DINRAIL-C45',     42.00, 'QT6904349 per เมตร', '2026-04-21'),
    ('UK-6N',           26.00, 'QT6904349 per ชิ้น', '2026-04-21'),
    ('TBR-30',           7.20, 'QT6904349 per ชิ้น', '2026-04-21'),
    ('XP0609D-10P',     38.00, 'QT6904349 per ตัว',  '2026-04-21'),
    ('PG36',            30.00, 'QT6904349 per ชิ้น', '2026-04-21'),
    ('WIREDUCT-60X40', 160.00, 'QT6904349 per เส้น', '2026-04-21'),
    ('WIREDUCT-40X40', 150.00, 'QT6904349 per เส้น', '2026-04-21'),
    ('LUG-C45-10',     430.00, 'QT6904349 per ชุด 100ชิ้น', '2026-04-21'),
    ('LUG-C45-6',      240.00, 'QT6904349 per ชุด 100ชิ้น', '2026-04-21'),
    ('LUG-C45-4',      200.00, 'QT6904349 per ชุด 100ชิ้น', '2026-04-21'),
    ('LUG-C45-2.5',    160.00, 'QT6904349 per ชุด 100ชิ้น', '2026-04-21'),
    ('LUG-TE6-014',    153.00, 'QT6904349 per ชุด 50ชิ้น',  '2026-04-21'),
    ('LUG-TE4-009',    105.00, 'QT6904349 per ชุด 100ชิ้น', '2026-04-21'),
    ('LUG-E6012',      119.00, 'QT6904349 per ชุด 100ชิ้น', '2026-04-21'),
    ('LUG-E4009',       88.00, 'QT6904349 per ชุด 100ชิ้น', '2026-04-21'),
    ('LUG-E2508',       74.00, 'QT6904349 per ชุด 100ชิ้น', '2026-04-21'),
    ('LUG-E1008',       61.00, 'QT6904349 per ชุด 100ชิ้น', '2026-04-21')
) AS pr(model, price, note, eff)
JOIN products p ON p.model = pr.model
JOIN suppliers s ON s.name = 'Perfect Motion Systems'
WHERE NOT EXISTS (
    SELECT 1 FROM supplier_prices sp
    WHERE sp.product_id = p.id AND sp.supplier_id = s.id AND sp.note = pr.note
);
