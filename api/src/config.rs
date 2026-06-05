//! อ่านค่า config จาก environment variables (.env)

/// ค่าตั้งต้นของแอป โหลดครั้งเดียวตอนเริ่มทำงาน
#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub port: u16,
}

impl Config {
    /// โหลดค่าจาก environment ถ้าตัวไหนไม่มีจะ panic พร้อมบอกชื่อ
    pub fn from_env() -> Self {
        // โหลดไฟล์ .env ถ้ามี (ไม่มีก็ไม่เป็นไร เช่นตอนรันใน Docker)
        let _ = dotenvy::dotenv();

        Self {
            database_url: required("DATABASE_URL"),
            jwt_secret: required("JWT_SECRET"),
            port: std::env::var("PORT")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(8080),
        }
    }
}

/// อ่าน env ที่จำเป็น ถ้าไม่มีให้หยุดทำงานทันทีพร้อมข้อความชัดเจน
fn required(key: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| panic!("ไม่พบ environment variable ที่จำเป็น: {key}"))
}
