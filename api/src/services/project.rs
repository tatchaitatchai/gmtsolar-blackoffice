use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    domain::project::{Project, ProjectCost, ProjectItem, ProjectItemCost, ProjectWithItems},
    error::AppError,
    repository,
};

pub async fn list(pool: &PgPool) -> Result<Vec<Project>, AppError> {
    repository::project::list_all(pool).await
}

pub async fn get(pool: &PgPool, id: Uuid) -> Result<ProjectWithItems, AppError> {
    repository::project::find_by_id(pool, id)
        .await?
        .ok_or(AppError::NotFound)
}

pub async fn create(
    pool: &PgPool,
    name: &str,
    customer_name: Option<&str>,
    address: Option<&str>,
) -> Result<Project, AppError> {
    repository::project::create(pool, name, customer_name, address).await
}

pub async fn update(
    pool: &PgPool,
    id: Uuid,
    name: &str,
    customer_name: Option<&str>,
    address: Option<&str>,
) -> Result<Project, AppError> {
    repository::project::update(pool, id, name, customer_name, address).await
}

pub async fn delete(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    repository::project::delete(pool, id).await
}

pub async fn add_item(
    pool: &PgPool,
    project_id: Uuid,
    product_id: Uuid,
    supplier_price_id: Option<Uuid>,
    quantity: Decimal,
) -> Result<ProjectItem, AppError> {
    let snapshot = if let Some(sp_id) = supplier_price_id {
        let sp = repository::project::find_supplier_price_for_snapshot(pool, sp_id)
            .await?
            .ok_or(AppError::NotFound)?;
        match sp.units_per_purchase {
            Some(upu) => sp.price / upu,
            None => sp.price,
        }
    } else {
        Decimal::ZERO
    };

    repository::project::add_item(pool, project_id, product_id, supplier_price_id, quantity, snapshot).await
}

pub async fn remove_item(pool: &PgPool, item_id: Uuid) -> Result<(), AppError> {
    repository::project::remove_item(pool, item_id).await
}

pub async fn cost(pool: &PgPool, id: Uuid) -> Result<ProjectCost, AppError> {
    let proj = repository::project::find_by_id(pool, id)
        .await?
        .ok_or(AppError::NotFound)?;

    let rows = repository::project::find_items_for_cost(pool, id).await?;

    let mut total = Decimal::ZERO;
    let items: Vec<ProjectItemCost> = rows
        .into_iter()
        .map(|r| {
            let item_cost = r.unit_price_snapshot * r.quantity;
            total += item_cost;
            ProjectItemCost {
                item_id: r.item_id,
                product_name: r.product_name,
                product_model: r.product_model,
                quantity: r.quantity,
                use_unit: r.use_unit,
                unit_price_snapshot: r.unit_price_snapshot,
                cost: item_cost,
                supplier_name: r.supplier_name,
            }
        })
        .collect();

    Ok(ProjectCost {
        project_id: proj.id,
        project_name: proj.name,
        total_cost: total,
        items,
    })
}
