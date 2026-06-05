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
    domain::project::{Project, ProjectCost, ProjectItem, ProjectWithItems},
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

pub async fn cost(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ProjectCost>, AppError> {
    Ok(Json(services::project::cost(&state.pool, id).await?))
}
