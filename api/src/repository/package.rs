use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    domain::package::{Package, PackageItem, PackageItemDetail, PackageWithItems},
    error::AppError,
};

pub async fn list_all(pool: &PgPool) -> Result<Vec<Package>, AppError> {
    let rows = sqlx::query_as!(
        Package,
        "SELECT id, name, description, created_at FROM packages ORDER BY created_at DESC"
    )
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<PackageWithItems>, AppError> {
    let pkg = sqlx::query_as!(
        Package,
        "SELECT id, name, description, created_at FROM packages WHERE id = $1",
        id
    )
    .fetch_optional(pool)
    .await?;

    let Some(pkg) = pkg else { return Ok(None) };

    let items = sqlx::query_as!(
        PackageItemDetail,
        r#"SELECT pi.id, pi.product_id, p.name AS product_name, p.model AS product_model,
                  p.use_unit, pi.quantity
           FROM package_items pi
           JOIN products p ON p.id = pi.product_id
           WHERE pi.package_id = $1
           ORDER BY p.name"#,
        id
    )
    .fetch_all(pool)
    .await?;

    Ok(Some(PackageWithItems {
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        created_at: pkg.created_at,
        items,
    }))
}

pub async fn create(pool: &PgPool, name: &str, description: Option<&str>) -> Result<Package, AppError> {
    let row = sqlx::query_as!(
        Package,
        "INSERT INTO packages (name, description) VALUES ($1, $2) RETURNING id, name, description, created_at",
        name,
        description
    )
    .fetch_one(pool)
    .await?;
    Ok(row)
}

pub async fn update(pool: &PgPool, id: Uuid, name: &str, description: Option<&str>) -> Result<Package, AppError> {
    let row = sqlx::query_as!(
        Package,
        "UPDATE packages SET name = $1, description = $2 WHERE id = $3 RETURNING id, name, description, created_at",
        name,
        description,
        id
    )
    .fetch_optional(pool)
    .await?;
    row.ok_or(AppError::NotFound)
}

pub async fn delete(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    let result = sqlx::query!("DELETE FROM packages WHERE id = $1", id)
        .execute(pool)
        .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}

pub async fn add_item(pool: &PgPool, package_id: Uuid, product_id: Uuid, quantity: Decimal) -> Result<PackageItem, AppError> {
    let row = sqlx::query_as!(
        PackageItem,
        "INSERT INTO package_items (package_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING id, package_id, product_id, quantity",
        package_id,
        product_id,
        quantity
    )
    .fetch_one(pool)
    .await?;
    Ok(row)
}

pub async fn remove_item(pool: &PgPool, item_id: Uuid) -> Result<(), AppError> {
    let result = sqlx::query!("DELETE FROM package_items WHERE id = $1", item_id)
        .execute(pool)
        .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}

pub struct ItemForCost {
    pub item_id: Uuid,
    pub product_id: Uuid,
    pub product_name: String,
    pub product_model: String,
    pub quantity: Decimal,
    pub use_unit: String,
    pub units_per_purchase: Option<Decimal>,
    pub cheapest_price: Option<Decimal>,
    pub cheapest_supplier_id: Option<Uuid>,
    pub cheapest_supplier_name: Option<String>,
}

pub async fn find_items_for_cost(pool: &PgPool, package_id: Uuid) -> Result<Vec<ItemForCost>, AppError> {
    let rows = sqlx::query!(
        r#"SELECT
               pi.id       AS item_id,
               pi.product_id,
               p.name      AS product_name,
               p.model     AS product_model,
               pi.quantity,
               p.use_unit,
               p.units_per_purchase,
               (SELECT sp2.price
                FROM supplier_prices sp2
                WHERE sp2.product_id = pi.product_id
                ORDER BY CASE WHEN p.units_per_purchase IS NOT NULL
                              THEN sp2.price / p.units_per_purchase
                              ELSE sp2.price
                         END ASC
                LIMIT 1)   AS cheapest_price,
               (SELECT sp2.supplier_id
                FROM supplier_prices sp2
                WHERE sp2.product_id = pi.product_id
                ORDER BY CASE WHEN p.units_per_purchase IS NOT NULL
                              THEN sp2.price / p.units_per_purchase
                              ELSE sp2.price
                         END ASC
                LIMIT 1)   AS cheapest_supplier_id,
               (SELECT s2.name
                FROM supplier_prices sp2
                JOIN suppliers s2 ON s2.id = sp2.supplier_id
                WHERE sp2.product_id = pi.product_id
                ORDER BY CASE WHEN p.units_per_purchase IS NOT NULL
                              THEN sp2.price / p.units_per_purchase
                              ELSE sp2.price
                         END ASC
                LIMIT 1)   AS cheapest_supplier_name
           FROM package_items pi
           JOIN products p ON p.id = pi.product_id
           WHERE pi.package_id = $1
           ORDER BY p.name"#,
        package_id
    )
    .fetch_all(pool)
    .await?
    .into_iter()
    .map(|r| ItemForCost {
        item_id: r.item_id,
        product_id: r.product_id,
        product_name: r.product_name,
        product_model: r.product_model,
        quantity: r.quantity,
        use_unit: r.use_unit,
        units_per_purchase: r.units_per_purchase,
        cheapest_price: r.cheapest_price,
        cheapest_supplier_id: r.cheapest_supplier_id,
        cheapest_supplier_name: r.cheapest_supplier_name,
    })
    .collect();
    Ok(rows)
}
