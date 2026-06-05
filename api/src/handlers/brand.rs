use axum::{extract::{Path, State}, Extension, Json};
use serde::Deserialize;
use uuid::Uuid;

use crate::{auth::Claims, domain::brand::Brand, error::AppError, services, state::AppState};

#[derive(Deserialize)]
pub struct BrandBody {
    pub name: String,
}

pub async fn list(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
) -> Result<Json<Vec<Brand>>, AppError> {
    Ok(Json(services::brand::list(&state.pool).await?))
}

pub async fn create(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Json(body): Json<BrandBody>,
) -> Result<Json<Brand>, AppError> {
    Ok(Json(services::brand::create(&state.pool, &body.name).await?))
}

pub async fn update(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(body): Json<BrandBody>,
) -> Result<Json<Brand>, AppError> {
    Ok(Json(services::brand::update(&state.pool, id, &body.name).await?))
}

pub async fn delete(
    _claims: Extension<Claims>,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<()>, AppError> {
    services::brand::delete(&state.pool, id).await?;
    Ok(Json(()))
}
