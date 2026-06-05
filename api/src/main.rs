//! จุดเริ่มต้นของ GMT Solar API
//!
//! โครงสร้างหลัก:
//!   - โหลด config จาก .env
//!   - เชื่อมต่อ Postgres + รัน migrations
//!   - ประกอบ router (เส้นทาง API) แล้วเปิดให้บริการ

mod config;
mod db;
mod error;

use axum::{routing::get, Json, Router};
use serde_json::{json, Value};
use sqlx::PgPool;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

/// state ที่ใช้ร่วมกันทุก handler (โคลนถูก เพราะข้างในเป็น pool/Arc)
#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub jwt_secret: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // ตั้งค่า logging — อ่านระดับจาก RUST_LOG
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .init();

    let config = config::Config::from_env();

    // เชื่อมต่อฐานข้อมูลและอัปเดต schema ให้ล่าสุด
    let pool = db::connect(&config.database_url).await?;
    db::run_migrations(&pool).await?;
    tracing::info!("เชื่อมต่อฐานข้อมูลและรัน migrations สำเร็จ");

    let state = AppState {
        pool,
        jwt_secret: config.jwt_secret.clone(),
    };

    let app = Router::new()
        .route("/api/health", get(health))
        // ในช่วง dev ให้ frontend (พอร์ตอื่น) เรียก API ได้
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = format!("0.0.0.0:{}", config.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("API พร้อมให้บริการที่ http://{addr}");
    axum::serve(listener, app).await?;

    Ok(())
}

/// ตรวจสุขภาพระบบ — เช็คว่าเชื่อมฐานข้อมูลได้จริง
async fn health(
    axum::extract::State(state): axum::extract::State<AppState>,
) -> Result<Json<Value>, error::AppError> {
    // ยิง query ง่าย ๆ เพื่อยืนยันว่า DB ตอบสนอง
    sqlx::query_scalar::<_, i32>("SELECT 1")
        .fetch_one(&state.pool)
        .await?;

    Ok(Json(json!({
        "status": "ok",
        "database": "connected"
    })))
}
