//! ชนิด error กลางของแอป + การแปลงเป็น HTTP response
//!
//! แทนที่จะให้แต่ละ handler จัดการ error เอง เรารวมไว้ที่เดียว
//! handler คืน `Result<T, AppError>` แล้ว axum จะแปลงเป็น response ให้อัตโนมัติ

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

/// error ทุกแบบที่ handler อาจคืนออกมา
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("ไม่พบข้อมูลที่ต้องการ")]
    NotFound,

    #[error("ข้อมูลไม่ถูกต้อง: {0}")]
    BadRequest(String),

    #[error("ยังไม่ได้ยืนยันตัวตน")]
    Unauthorized,

    /// error จากฐานข้อมูล — ไม่เปิดเผยรายละเอียดให้ client
    #[error("เกิดข้อผิดพลาดกับฐานข้อมูล")]
    Database(#[from] sqlx::Error),

    /// error ภายในอื่น ๆ
    #[error("เกิดข้อผิดพลาดภายในระบบ")]
    Internal(#[from] anyhow::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let status = match &self {
            AppError::NotFound => StatusCode::NOT_FOUND,
            AppError::BadRequest(_) => StatusCode::BAD_REQUEST,
            AppError::Unauthorized => StatusCode::UNAUTHORIZED,
            AppError::Database(_) | AppError::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
        };

        // log รายละเอียดจริงไว้ฝั่ง server (client เห็นแค่ข้อความสุภาพ)
        if status == StatusCode::INTERNAL_SERVER_ERROR {
            tracing::error!("internal error: {self:?}");
        }

        let body = Json(json!({ "error": self.to_string() }));
        (status, body).into_response()
    }
}
