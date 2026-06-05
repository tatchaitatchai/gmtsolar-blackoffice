use sqlx::PgPool;
use uuid::Uuid;

use crate::{domain::supplier::Supplier, error::AppError};

pub async fn list(pool: &PgPool) -> Result<Vec<Supplier>, AppError> {
    let rows = sqlx::query_as!(
        Supplier,
        "SELECT id, name, contact, note, created_at FROM suppliers ORDER BY name"
    )
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn create(pool: &PgPool, name: &str, contact: Option<&str>, note: Option<&str>) -> Result<Supplier, AppError> {
    let row = sqlx::query_as!(
        Supplier,
        "INSERT INTO suppliers (name, contact, note) VALUES ($1, $2, $3)
         RETURNING id, name, contact, note, created_at",
        name, contact, note
    )
    .fetch_one(pool)
    .await?;
    Ok(row)
}

pub async fn update(pool: &PgPool, id: Uuid, name: &str, contact: Option<&str>, note: Option<&str>) -> Result<Supplier, AppError> {
    let row = sqlx::query_as!(
        Supplier,
        "UPDATE suppliers SET name = $1, contact = $2, note = $3 WHERE id = $4
         RETURNING id, name, contact, note, created_at",
        name, contact, note, id
    )
    .fetch_optional(pool)
    .await?
    .ok_or(AppError::NotFound)?;
    Ok(row)
}

pub async fn delete(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    let result = sqlx::query!("DELETE FROM suppliers WHERE id = $1", id)
        .execute(pool)
        .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}
