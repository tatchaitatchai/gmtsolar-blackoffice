use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    domain::package::{Package, PackageCost, PackageItem, PackageItemCost, PackageWithItems},
    error::AppError,
    repository,
};

pub async fn list(pool: &PgPool) -> Result<Vec<Package>, AppError> {
    repository::package::list_all(pool).await
}

pub async fn get(pool: &PgPool, id: Uuid) -> Result<PackageWithItems, AppError> {
    repository::package::find_by_id(pool, id)
        .await?
        .ok_or(AppError::NotFound)
}

pub async fn create(pool: &PgPool, name: &str, description: Option<&str>) -> Result<Package, AppError> {
    repository::package::create(pool, name, description).await
}

pub async fn update(pool: &PgPool, id: Uuid, name: &str, description: Option<&str>) -> Result<Package, AppError> {
    repository::package::update(pool, id, name, description).await
}

pub async fn delete(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    repository::package::delete(pool, id).await
}

pub async fn add_item(pool: &PgPool, package_id: Uuid, product_id: Uuid, quantity: Decimal) -> Result<PackageItem, AppError> {
    repository::package::add_item(pool, package_id, product_id, quantity).await
}

pub async fn remove_item(pool: &PgPool, item_id: Uuid) -> Result<(), AppError> {
    repository::package::remove_item(pool, item_id).await
}

pub async fn cost(pool: &PgPool, id: Uuid) -> Result<PackageCost, AppError> {
    let pkg = repository::package::find_by_id(pool, id)
        .await?
        .ok_or(AppError::NotFound)?;

    let rows = repository::package::find_items_for_cost(pool, id).await?;

    let mut total = Decimal::ZERO;
    let items: Vec<PackageItemCost> = rows
        .into_iter()
        .map(|r| {
            let price_per_use_unit = r.cheapest_price.map(|p| {
                match r.units_per_purchase {
                    Some(upu) => p / upu,
                    None => p,
                }
            });
            let item_cost = price_per_use_unit.map(|ppu| ppu * r.quantity);
            if let Some(c) = item_cost {
                total += c;
            }
            PackageItemCost {
                item_id: r.item_id,
                product_id: r.product_id,
                product_name: r.product_name,
                product_model: r.product_model,
                quantity: r.quantity,
                use_unit: r.use_unit,
                price_per_use_unit,
                cost: item_cost,
                supplier_id: r.cheapest_supplier_id,
                supplier_name: r.cheapest_supplier_name,
                has_price: r.cheapest_price.is_some(),
            }
        })
        .collect();

    Ok(PackageCost {
        package_id: pkg.id,
        package_name: pkg.name,
        total_cost: total,
        items,
    })
}
