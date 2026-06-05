use sqlx::PgPool;
use uuid::Uuid;

use crate::{domain::brand::Brand, error::AppError};

pub async fn list(pool: &PgPool) -> Result<Vec<Brand>, AppError> {
    let rows = sqlx::query_as!(Brand, "SELECT id, name FROM brands ORDER BY name")
        .fetch_all(pool)
        .await?;
    Ok(rows)
}

pub async fn create(pool: &PgPool, name: &str) -> Result<Brand, AppError> {
    let row = sqlx::query_as!(
        Brand,
        "INSERT INTO brands (name) VALUES ($1) RETURNING id, name",
        name
    )
    .fetch_one(pool)
    .await?;
    Ok(row)
}

pub async fn update(pool: &PgPool, id: Uuid, name: &str) -> Result<Brand, AppError> {
    let row = sqlx::query_as!(
        Brand,
        "UPDATE brands SET name = $1 WHERE id = $2 RETURNING id, name",
        name,
        id
    )
    .fetch_optional(pool)
    .await?
    .ok_or(AppError::NotFound)?;
    Ok(row)
}

pub async fn delete(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    let result = sqlx::query!("DELETE FROM brands WHERE id = $1", id)
        .execute(pool)
        .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}
