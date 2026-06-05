//! สร้าง connection pool ไปยัง Postgres และรัน migrations

use sqlx::postgres::{PgPool, PgPoolOptions};
use std::time::Duration;

/// สร้าง pool (ชุดการเชื่อมต่อที่ใช้ซ้ำได้) ไปยังฐานข้อมูล
pub async fn connect(database_url: &str) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(10)
        .acquire_timeout(Duration::from_secs(5))
        .connect(database_url)
        .await
}

/// รัน migration ทั้งหมดในโฟลเดอร์ migrations/ ตามลำดับ
/// sqlx จะจำว่ารันอันไหนไปแล้ว จึงรันซ้ำได้อย่างปลอดภัย
pub async fn run_migrations(pool: &PgPool) -> Result<(), sqlx::migrate::MigrateError> {
    sqlx::migrate!("./migrations").run(pool).await
}
