INSERT INTO categories (name) VALUES
    ('อินเวอร์เตอร์'),
    ('แบตเตอรี่'),
    ('โซล่าเซลล์'),
    ('โครงยึด'),
    ('สายไฟ'),
    ('อุปกรณ์เสริม')
ON CONFLICT (name) DO NOTHING;
