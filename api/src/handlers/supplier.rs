use axum::{extract::{Path, State}, Extension, Json};
use serde::Deserialize;
use uuid::Uuid;

use crate::{auth::Claims, domain::supplier::Supplier, error::AppError, services, state::AppState};

#[derive(Deserialize)]
pub struct SupplierBody {
    pub name: String,
    pub contact: Option<String>,
    pub note: Option<String>,
}

pub async fn list(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
) -> Result<Json<Vec<Supplier>>, AppError> {
    Ok(Json(services::supplier::list(&state.pool).await?))
}

pub async fn create(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Json(body): Json<SupplierBody>,
) -> Result<Json<Supplier>, AppError> {
    Ok(Json(services::supplier::create(&state.pool, &body.name, body.contact.as_deref(), body.note.as_deref()).await?))
}

pub async fn update(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(body): Json<SupplierBody>,
) -> Result<Json<Supplier>, AppError> {
    Ok(Json(services::supplier::update(&state.pool, id, &body.name, body.contact.as_deref(), body.note.as_deref()).await?))
}

pub async fn delete(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<()>, AppError> {
    services::supplier::delete(&state.pool, id).await?;
    Ok(Json(()))
}
