use axum::{extract::State, Json};
use serde_json::{json, Value};

use crate::{error::AppError, state::AppState};

pub async fn health(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    sqlx::query_scalar::<_, i32>("SELECT 1")
        .fetch_one(&state.pool)
        .await?;

    Ok(Json(json!({ "status": "ok", "database": "connected" })))
}
