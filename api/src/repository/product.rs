use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{domain::product::{Product, ProductDetail}, error::AppError};

pub async fn list(pool: &PgPool) -> Result<Vec<ProductDetail>, AppError> {
    let rows = sqlx::query!(
        r#"SELECT p.id, p.category_id, c.name AS category_name,
                  p.brand_id, b.name AS brand_name,
                  p.name, p.model, p.spec, p.use_unit,
                  p.purchase_unit, p.units_per_purchase, p.created_at
           FROM products p
           JOIN categories c ON c.id = p.category_id
           JOIN brands b ON b.id = p.brand_id
           ORDER BY p.name"#
    )
    .fetch_all(pool)
    .await?
    .into_iter()
    .map(|r| ProductDetail {
        id: r.id,
        category_id: r.category_id,
        category_name: r.category_name,
        brand_id: r.brand_id,
        brand_name: r.brand_name,
        name: r.name,
        model: r.model,
        spec: r.spec,
        use_unit: r.use_unit,
        purchase_unit: r.purchase_unit,
        units_per_purchase: r.units_per_purchase,
        created_at: r.created_at,
    })
    .collect();
    Ok(rows)
}

pub async fn create(
    pool: &PgPool,
    category_id: Uuid,
    brand_id: Uuid,
    name: &str,
    model: &str,
    spec: &serde_json::Value,
    use_unit: &str,
    purchase_unit: Option<&str>,
    units_per_purchase: Option<Decimal>,
) -> Result<Product, AppError> {
    let row = sqlx::query_as!(
        Product,
        r#"INSERT INTO products (category_id, brand_id, name, model, spec, use_unit, purchase_unit, units_per_purchase)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id, category_id, brand_id, name, model, spec, use_unit, purchase_unit, units_per_purchase, created_at"#,
        category_id, brand_id, name, model, spec, use_unit, purchase_unit, units_per_purchase
    )
    .fetch_one(pool)
    .await?;
    Ok(row)
}

pub async fn update(
    pool: &PgPool,
    id: Uuid,
    category_id: Uuid,
    brand_id: Uuid,
    name: &str,
    model: &str,
    spec: &serde_json::Value,
    use_unit: &str,
    purchase_unit: Option<&str>,
    units_per_purchase: Option<Decimal>,
) -> Result<Product, AppError> {
    let row = sqlx::query_as!(
        Product,
        r#"UPDATE products
           SET category_id=$1, brand_id=$2, name=$3, model=$4, spec=$5,
               use_unit=$6, purchase_unit=$7, units_per_purchase=$8
           WHERE id=$9
           RETURNING id, category_id, brand_id, name, model, spec, use_unit, purchase_unit, units_per_purchase, created_at"#,
        category_id, brand_id, name, model, spec, use_unit, purchase_unit, units_per_purchase, id
    )
    .fetch_optional(pool)
    .await?
    .ok_or(AppError::NotFound)?;
    Ok(row)
}

pub async fn delete(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    let result = sqlx::query!("DELETE FROM products WHERE id = $1", id)
        .execute(pool)
        .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}
