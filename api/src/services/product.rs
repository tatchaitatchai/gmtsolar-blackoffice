use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{domain::product::{Product, ProductDetail}, error::AppError, repository};

pub async fn list(pool: &PgPool) -> Result<Vec<ProductDetail>, AppError> {
    repository::product::list(pool).await
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
    repository::product::create(pool, category_id, brand_id, name, model, spec, use_unit, purchase_unit, units_per_purchase).await
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
    repository::product::update(pool, id, category_id, brand_id, name, model, spec, use_unit, purchase_unit, units_per_purchase).await
}

pub async fn delete(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    repository::product::delete(pool, id).await
}
