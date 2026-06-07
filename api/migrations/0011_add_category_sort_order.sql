ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 99;

UPDATE categories SET sort_order = 1 WHERE name = 'อินเวอร์เตอร์';
UPDATE categories SET sort_order = 2 WHERE name = 'แบตเตอรี่';
UPDATE categories SET sort_order = 3 WHERE name = 'โซล่าเซลล์';
UPDATE categories SET sort_order = 4 WHERE name = 'โครงยึด';
UPDATE categories SET sort_order = 5 WHERE name = 'สายไฟ';
UPDATE categories SET sort_order = 6 WHERE name = 'อุปกรณ์เสริม';
UPDATE categories SET sort_order = 7 WHERE name = 'บริการ';
