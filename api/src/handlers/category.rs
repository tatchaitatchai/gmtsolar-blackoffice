use axum::{extract::{Path, State}, Extension, Json};
use serde::Deserialize;
use uuid::Uuid;

use crate::{auth::Claims, domain::category::Category, error::AppError, services, state::AppState};

#[derive(Deserialize)]
pub struct CategoryBody {
    pub name: String,
}

pub async fn list(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
) -> Result<Json<Vec<Category>>, AppError> {
    let items = services::category::list(&state.pool).await?;
    Ok(Json(items))
}

pub async fn create(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Json(body): Json<CategoryBody>,
) -> Result<Json<Category>, AppError> {
    let item = services::category::create(&state.pool, &body.name).await?;
    Ok(Json(item))
}

pub async fn update(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(body): Json<CategoryBody>,
) -> Result<Json<Category>, AppError> {
    let item = services::category::update(&state.pool, id, &body.name).await?;
    Ok(Json(item))
}

pub async fn delete(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<()>, AppError> {
    services::category::delete(&state.pool, id).await?;
    Ok(Json(()))
}
