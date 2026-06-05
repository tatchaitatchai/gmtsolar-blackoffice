use sqlx::PgPool;
use uuid::Uuid;

use crate::{domain::brand::Brand, error::AppError, repository};

pub async fn list(pool: &PgPool) -> Result<Vec<Brand>, AppError> {
    repository::brand::list(pool).await
}

pub async fn create(pool: &PgPool, name: &str) -> Result<Brand, AppError> {
    repository::brand::create(pool, name).await
}

pub async fn update(pool: &PgPool, id: Uuid, name: &str) -> Result<Brand, AppError> {
    repository::brand::update(pool, id, name).await
}

pub async fn delete(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    repository::brand::delete(pool, id).await
}
