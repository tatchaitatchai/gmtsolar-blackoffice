use axum::{extract::{Path, State}, Extension, Json};
use rust_decimal::Decimal;
use serde::Deserialize;
use uuid::Uuid;

use crate::{auth::Claims, domain::product::{Product, ProductDetail}, error::AppError, services, state::AppState};

#[derive(Deserialize)]
pub struct ProductBody {
    pub category_id: Uuid,
    pub brand_id: Uuid,
    pub name: String,
    pub model: String,
    pub spec: serde_json::Value,
    pub use_unit: String,
    pub purchase_unit: Option<String>,
    pub units_per_purchase: Option<Decimal>,
}

pub async fn list(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
) -> Result<Json<Vec<ProductDetail>>, AppError> {
    Ok(Json(services::product::list(&state.pool).await?))
}

pub async fn create(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Json(body): Json<ProductBody>,
) -> Result<Json<Product>, AppError> {
    let item = services::product::create(
        &state.pool,
        body.category_id, body.brand_id,
        &body.name, &body.model, &body.spec, &body.use_unit,
        body.purchase_unit.as_deref(), body.units_per_purchase,
    ).await?;
    Ok(Json(item))
}

pub async fn update(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(body): Json<ProductBody>,
) -> Result<Json<Product>, AppError> {
    let item = services::product::update(
        &state.pool, id,
        body.category_id, body.brand_id,
        &body.name, &body.model, &body.spec, &body.use_unit,
        body.purchase_unit.as_deref(), body.units_per_purchase,
    ).await?;
    Ok(Json(item))
}

pub async fn delete(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<()>, AppError> {
    services::product::delete(&state.pool, id).await?;
    Ok(Json(()))
}
