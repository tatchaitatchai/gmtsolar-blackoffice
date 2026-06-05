use sqlx::PgPool;
use uuid::Uuid;

use crate::{domain::supplier::Supplier, error::AppError, repository};

pub async fn list(pool: &PgPool) -> Result<Vec<Supplier>, AppError> {
    repository::supplier::list(pool).await
}

pub async fn create(pool: &PgPool, name: &str, contact: Option<&str>, note: Option<&str>) -> Result<Supplier, AppError> {
    repository::supplier::create(pool, name, contact, note).await
}

pub async fn update(pool: &PgPool, id: Uuid, name: &str, contact: Option<&str>, note: Option<&str>) -> Result<Supplier, AppError> {
    repository::supplier::update(pool, id, name, contact, note).await
}

pub async fn delete(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    repository::supplier::delete(pool, id).await
}
