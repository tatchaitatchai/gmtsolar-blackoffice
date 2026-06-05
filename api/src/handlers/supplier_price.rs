use axum::{extract::{Path, State}, Extension, Json};
use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::Deserialize;
use uuid::Uuid;

use crate::{auth::Claims, domain::supplier_price::{SupplierPrice, SupplierPriceEntry}, error::AppError, services, state::AppState};

#[derive(Deserialize)]
pub struct SupplierPriceBody {
    pub supplier_id: Uuid,
    pub price: Decimal,
    pub note: Option<String>,
    pub effective_date: Option<NaiveDate>,
}

pub async fn list(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(product_id): Path<Uuid>,
) -> Result<Json<Vec<SupplierPriceEntry>>, AppError> {
    Ok(Json(services::supplier_price::list_by_product(&state.pool, product_id).await?))
}

pub async fn create(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(product_id): Path<Uuid>,
    Json(body): Json<SupplierPriceBody>,
) -> Result<Json<SupplierPrice>, AppError> {
    let item = services::supplier_price::create(
        &state.pool,
        product_id,
        body.supplier_id,
        body.price,
        body.note.as_deref(),
        body.effective_date,
    ).await?;
    Ok(Json(item))
}

pub async fn delete(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<()>, AppError> {
    services::supplier_price::delete(&state.pool, id).await?;
    Ok(Json(()))
}
