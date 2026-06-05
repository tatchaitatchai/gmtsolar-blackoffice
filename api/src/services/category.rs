use sqlx::PgPool;
use uuid::Uuid;

use crate::{domain::category::Category, error::AppError, repository};

pub async fn list(pool: &PgPool) -> Result<Vec<Category>, AppError> {
    repository::category::list(pool).await
}

pub async fn create(pool: &PgPool, name: &str) -> Result<Category, AppError> {
    repository::category::create(pool, name).await
}

pub async fn update(pool: &PgPool, id: Uuid, name: &str) -> Result<Category, AppError> {
    repository::category::update(pool, id, name).await
}

pub async fn delete(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    repository::category::delete(pool, id).await
}
