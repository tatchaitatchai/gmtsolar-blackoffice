use chrono::NaiveDate;
use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{domain::supplier_price::{SupplierPrice, SupplierPriceEntry}, error::AppError, repository};

pub async fn list_by_product(pool: &PgPool, product_id: Uuid) -> Result<Vec<SupplierPriceEntry>, AppError> {
    let mut entries = repository::supplier_price::list_by_product(pool, product_id).await?;

    let min = entries.iter().map(|e| e.price_per_use_unit).reduce(Decimal::min);
    if let Some(m) = min {
        for e in &mut entries {
            e.is_cheapest = e.price_per_use_unit == m;
        }
    }

    Ok(entries)
}

pub async fn create(
    pool: &PgPool,
    product_id: Uuid,
    supplier_id: Uuid,
    price: Decimal,
    note: Option<&str>,
    effective_date: Option<NaiveDate>,
) -> Result<SupplierPrice, AppError> {
    repository::supplier_price::create(pool, product_id, supplier_id, price, note, effective_date).await
}

pub async fn delete(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    repository::supplier_price::delete(pool, id).await
}
