INSERT INTO users (id, email, password_hash, name)
SELECT
    gen_random_uuid(),
    'admin@gmt.com',
    '$argon2id$v=19$m=65536,t=3,p=4$eqk4eAQMgvjehVaGpPOAeg$f+aFy3Ap+i8P2gk3FNX7fGtX4K2ccg0uAbQ5/5WDezI',
    'GMT Admin'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@gmt.com'
);
