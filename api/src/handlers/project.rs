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
    domain::project::{Project, ProjectCost, ProjectItem, ProjectItemGroup, ProjectWithItems},
    error::AppError,
    services,
    state::AppState,
};

#[derive(Deserialize)]
pub struct ProjectBody {
    pub name: String,
    pub customer_name: Option<String>,
    pub address: Option<String>,
}

#[derive(Deserialize)]
pub struct ProjectItemBody {
    pub product_id: Uuid,
    pub supplier_price_id: Option<Uuid>,
    pub quantity: Decimal,
}

#[derive(Deserialize)]
pub struct UpdateItemMetaBody {
    pub markup_percent: Decimal,
    pub group_id: Option<Uuid>,
}

#[derive(Deserialize)]
pub struct GroupBody {
    pub name: String,
    pub custom_sell_price: Option<Decimal>,
    pub is_visible: Option<bool>,
    pub sort_order: Option<i32>,
}

#[derive(Deserialize)]
pub struct ImportPackageBody {
    pub package_id: Uuid,
    pub item_ids: Vec<Uuid>,
}

#[derive(Deserialize)]
pub struct PricingBody {
    pub vat_percent: Decimal,
    pub overhead_percent: Decimal,
    pub show_overhead: bool,
    pub qt_number: Option<String>,
}

pub async fn list(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
) -> Result<Json<Vec<Project>>, AppError> {
    Ok(Json(services::project::list(&state.pool).await?))
}

pub async fn get(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ProjectWithItems>, AppError> {
    Ok(Json(services::project::get(&state.pool, id).await?))
}

pub async fn create(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Json(body): Json<ProjectBody>,
) -> Result<(StatusCode, Json<Project>), AppError> {
    let proj = services::project::create(
        &state.pool,
        &body.name,
        body.customer_name.as_deref(),
        body.address.as_deref(),
    )
    .await?;
    Ok((StatusCode::CREATED, Json(proj)))
}

pub async fn update(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(body): Json<ProjectBody>,
) -> Result<Json<Project>, AppError> {
    Ok(Json(
        services::project::update(
            &state.pool,
            id,
            &body.name,
            body.customer_name.as_deref(),
            body.address.as_deref(),
        )
        .await?,
    ))
}

pub async fn delete(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<()>, AppError> {
    services::project::delete(&state.pool, id).await?;
    Ok(Json(()))
}

pub async fn add_item(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(project_id): Path<Uuid>,
    Json(body): Json<ProjectItemBody>,
) -> Result<(StatusCode, Json<ProjectItem>), AppError> {
    let item = services::project::add_item(
        &state.pool,
        project_id,
        body.product_id,
        body.supplier_price_id,
        body.quantity,
    )
    .await?;
    Ok((StatusCode::CREATED, Json(item)))
}

pub async fn remove_item(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(item_id): Path<Uuid>,
) -> Result<Json<()>, AppError> {
    services::project::remove_item(&state.pool, item_id).await?;
    Ok(Json(()))
}

pub async fn update_item_meta(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(item_id): Path<Uuid>,
    Json(body): Json<UpdateItemMetaBody>,
) -> Result<Json<()>, AppError> {
    services::project::update_item_meta(&state.pool, item_id, body.markup_percent, body.group_id).await?;
    Ok(Json(()))
}

pub async fn cost(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ProjectCost>, AppError> {
    Ok(Json(services::project::cost(&state.pool, id).await?))
}

pub async fn list_groups(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(project_id): Path<Uuid>,
) -> Result<Json<Vec<ProjectItemGroup>>, AppError> {
    Ok(Json(services::project::list_groups(&state.pool, project_id).await?))
}

pub async fn create_group(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(project_id): Path<Uuid>,
    Json(body): Json<GroupBody>,
) -> Result<(StatusCode, Json<ProjectItemGroup>), AppError> {
    let sort_order = body.sort_order.unwrap_or(0);
    let group = services::project::create_group(&state.pool, project_id, &body.name, sort_order).await?;
    Ok((StatusCode::CREATED, Json(group)))
}

pub async fn update_group(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(body): Json<GroupBody>,
) -> Result<Json<ProjectItemGroup>, AppError> {
    let is_visible = body.is_visible.unwrap_or(true);
    Ok(Json(
        services::project::update_group(&state.pool, id, &body.name, body.custom_sell_price, is_visible).await?,
    ))
}

pub async fn delete_group(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<()>, AppError> {
    services::project::delete_group(&state.pool, id).await?;
    Ok(Json(()))
}

pub async fn import_package(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(project_id): Path<Uuid>,
    Json(body): Json<ImportPackageBody>,
) -> Result<Json<()>, AppError> {
    services::project::import_package(&state.pool, project_id, body.package_id, &body.item_ids).await?;
    Ok(Json(()))
}

pub async fn update_pricing(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(body): Json<PricingBody>,
) -> Result<Json<Project>, AppError> {
    Ok(Json(
        services::project::update_pricing(
            &state.pool, id,
            body.vat_percent, body.overhead_percent, body.show_overhead,
            body.qt_number.as_deref(),
        ).await?,
    ))
}
