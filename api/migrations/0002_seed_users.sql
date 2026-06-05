-- seed ผู้ใช้เริ่มต้น (ไม่มีหน้า register, เพิ่มตรงนี้เอง)
INSERT INTO users (email, password_hash, name) VALUES (
    'mindtatchai34@gmail.com',
    '$argon2id$v=19$m=19456,t=2,p=1$7R7a8Si4N+5rdVdGFe6yUg$ifjBWsoKc6mXeAmRwsPoxQmaKGNt/37Mai+0xzkF6PA',
    'Admin'
) ON CONFLICT (email) DO NOTHING;
