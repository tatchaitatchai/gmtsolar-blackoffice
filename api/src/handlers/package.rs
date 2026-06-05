use axum::{
    extract::{Path, State},
    http::StatusCode,
    Extension, Json,
};
use rust_decimal::Decimal;
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    auth::Claims,
    domain::package::{Package, PackageCost, PackageItem, PackageWithItems},
    error::AppError,
    services,
    state::AppState,
};

#[derive(Deserialize)]
pub struct PackageBody {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Deserialize)]
pub struct PackageItemBody {
    pub product_id: Uuid,
    pub quantity: Decimal,
}

pub async fn list(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
) -> Result<Json<Vec<Package>>, AppError> {
    Ok(Json(services::package::list(&state.pool).await?))
}

pub async fn get(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<PackageWithItems>, AppError> {
    Ok(Json(services::package::get(&state.pool, id).await?))
}

pub async fn create(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Json(body): Json<PackageBody>,
) -> Result<(StatusCode, Json<Package>), AppError> {
    let pkg = services::package::create(&state.pool, &body.name, body.description.as_deref()).await?;
    Ok((StatusCode::CREATED, Json(pkg)))
}

pub async fn update(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(body): Json<PackageBody>,
) -> Result<Json<Package>, AppError> {
    Ok(Json(services::package::update(&state.pool, id, &body.name, body.description.as_deref()).await?))
}

pub async fn delete(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<()>, AppError> {
    services::package::delete(&state.pool, id).await?;
    Ok(Json(()))
}

pub async fn add_item(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(package_id): Path<Uuid>,
    Json(body): Json<PackageItemBody>,
) -> Result<(StatusCode, Json<PackageItem>), AppError> {
    let item = services::package::add_item(&state.pool, package_id, body.product_id, body.quantity).await?;
    Ok((StatusCode::CREATED, Json(item)))
}

pub async fn remove_item(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(item_id): Path<Uuid>,
) -> Result<Json<()>, AppError> {
    services::package::remove_item(&state.pool, item_id).await?;
    Ok(Json(()))
}

pub async fn cost(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<PackageCost>, AppError> {
    Ok(Json(services::package::cost(&state.pool, id).await?))
}
