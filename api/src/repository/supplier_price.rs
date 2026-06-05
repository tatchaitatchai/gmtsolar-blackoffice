use chrono::NaiveDate;
use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{domain::supplier_price::{SupplierPrice, SupplierPriceEntry}, error::AppError};

pub async fn list_by_product(pool: &PgPool, product_id: Uuid) -> Result<Vec<SupplierPriceEntry>, AppError> {
    let rows = sqlx::query!(
        r#"SELECT sp.id, sp.product_id, sp.supplier_id, s.name AS supplier_name,
                  sp.price, sp.note, sp.effective_date, sp.created_at,
                  p.use_unit, p.purchase_unit, p.units_per_purchase
           FROM supplier_prices sp
           JOIN suppliers s ON s.id = sp.supplier_id
           JOIN products p ON p.id = sp.product_id
           WHERE sp.product_id = $1
           ORDER BY sp.created_at"#,
        product_id
    )
    .fetch_all(pool)
    .await?
    .into_iter()
    .map(|r| {
        let price_per_use_unit = match r.units_per_purchase {
            Some(upu) => r.price / upu,
            None => r.price,
        };
        SupplierPriceEntry {
            id: r.id,
            product_id: r.product_id,
            supplier_id: r.supplier_id,
            supplier_name: r.supplier_name,
            price: r.price,
            price_per_use_unit,
            use_unit: r.use_unit,
            purchase_unit: r.purchase_unit,
            units_per_purchase: r.units_per_purchase,
            note: r.note,
            effective_date: r.effective_date,
            created_at: r.created_at,
            is_cheapest: false,
        }
    })
    .collect();
    Ok(rows)
}

pub async fn create(
    pool: &PgPool,
    product_id: Uuid,
    supplier_id: Uuid,
    price: Decimal,
    note: Option<&str>,
    effective_date: Option<NaiveDate>,
) -> Result<SupplierPrice, AppError> {
    let row = sqlx::query_as!(
        SupplierPrice,
        r#"INSERT INTO supplier_prices (product_id, supplier_id, price, note, effective_date)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, product_id, supplier_id, price, note, effective_date, created_at"#,
        product_id, supplier_id, price, note, effective_date
    )
    .fetch_one(pool)
    .await?;
    Ok(row)
}

pub async fn delete(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    let result = sqlx::query!("DELETE FROM supplier_prices WHERE id = $1", id)
        .execute(pool)
        .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}
