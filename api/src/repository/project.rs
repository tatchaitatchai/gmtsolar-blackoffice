use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    domain::project::{Project, ProjectItem, ProjectItemDetail, ProjectWithItems},
    error::AppError,
};

pub async fn list_all(pool: &PgPool) -> Result<Vec<Project>, AppError> {
    let rows = sqlx::query_as!(
        Project,
        "SELECT id, name, customer_name, address, created_at FROM projects ORDER BY created_at DESC"
    )
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn find_by_id(pool: &PgPool, id: Uuid) -> Result<Option<ProjectWithItems>, AppError> {
    let proj = sqlx::query_as!(
        Project,
        "SELECT id, name, customer_name, address, created_at FROM projects WHERE id = $1",
        id
    )
    .fetch_optional(pool)
    .await?;

    let Some(proj) = proj else { return Ok(None) };

    let items = sqlx::query_as!(
        ProjectItemDetail,
        r#"SELECT pi.id, pi.product_id, p.name AS product_name, p.model AS product_model,
                  p.use_unit, pi.quantity, pi.supplier_price_id,
                  (SELECT s2.name FROM supplier_prices sp2
                   JOIN suppliers s2 ON s2.id = sp2.supplier_id
                   WHERE sp2.id = pi.supplier_price_id) AS supplier_name,
                  pi.unit_price_snapshot
           FROM project_items pi
           JOIN products p ON p.id = pi.product_id
           WHERE pi.project_id = $1
           ORDER BY p.name"#,
        id
    )
    .fetch_all(pool)
    .await?;

    Ok(Some(ProjectWithItems {
        id: proj.id,
        name: proj.name,
        customer_name: proj.customer_name,
        address: proj.address,
        created_at: proj.created_at,
        items,
    }))
}

pub async fn create(
    pool: &PgPool,
    name: &str,
    customer_name: Option<&str>,
    address: Option<&str>,
) -> Result<Project, AppError> {
    let row = sqlx::query_as!(
        Project,
        "INSERT INTO projects (name, customer_name, address) VALUES ($1, $2, $3) RETURNING id, name, customer_name, address, created_at",
        name, customer_name, address
    )
    .fetch_one(pool)
    .await?;
    Ok(row)
}

pub async fn update(
    pool: &PgPool,
    id: Uuid,
    name: &str,
    customer_name: Option<&str>,
    address: Option<&str>,
) -> Result<Project, AppError> {
    let row = sqlx::query_as!(
        Project,
        "UPDATE projects SET name = $1, customer_name = $2, address = $3 WHERE id = $4 RETURNING id, name, customer_name, address, created_at",
        name, customer_name, address, id
    )
    .fetch_optional(pool)
    .await?;
    row.ok_or(AppError::NotFound)
}

pub async fn delete(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    let result = sqlx::query!("DELETE FROM projects WHERE id = $1", id)
        .execute(pool)
        .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}

pub struct SupplierPriceForSnapshot {
    pub price: Decimal,
    pub units_per_purchase: Option<Decimal>,
}

pub async fn find_supplier_price_for_snapshot(
    pool: &PgPool,
    supplier_price_id: Uuid,
) -> Result<Option<SupplierPriceForSnapshot>, AppError> {
    let row = sqlx::query!(
        r#"SELECT sp.price, p.units_per_purchase
           FROM supplier_prices sp
           JOIN products p ON p.id = sp.product_id
           WHERE sp.id = $1"#,
        supplier_price_id
    )
    .fetch_optional(pool)
    .await?;
    Ok(row.map(|r| SupplierPriceForSnapshot {
        price: r.price,
        units_per_purchase: r.units_per_purchase,
    }))
}

pub async fn add_item(
    pool: &PgPool,
    project_id: Uuid,
    product_id: Uuid,
    supplier_price_id: Option<Uuid>,
    quantity: Decimal,
    unit_price_snapshot: Decimal,
) -> Result<ProjectItem, AppError> {
    let row = sqlx::query_as!(
        ProjectItem,
        r#"INSERT INTO project_items (project_id, product_id, supplier_price_id, quantity, unit_price_snapshot)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, project_id, product_id, supplier_price_id, quantity, unit_price_snapshot"#,
        project_id, product_id, supplier_price_id, quantity, unit_price_snapshot
    )
    .fetch_one(pool)
    .await?;
    Ok(row)
}

pub async fn remove_item(pool: &PgPool, item_id: Uuid) -> Result<(), AppError> {
    let result = sqlx::query!("DELETE FROM project_items WHERE id = $1", item_id)
        .execute(pool)
        .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}

pub struct ItemForCost {
    pub item_id: Uuid,
    pub product_name: String,
    pub product_model: String,
    pub quantity: Decimal,
    pub use_unit: String,
    pub unit_price_snapshot: Decimal,
    pub supplier_name: Option<String>,
}

pub async fn find_items_for_cost(pool: &PgPool, project_id: Uuid) -> Result<Vec<ItemForCost>, AppError> {
    let rows = sqlx::query!(
        r#"SELECT pi.id AS item_id, p.name AS product_name, p.model AS product_model,
                  pi.quantity, p.use_unit, pi.unit_price_snapshot,
                  (SELECT s2.name FROM supplier_prices sp2
                   JOIN suppliers s2 ON s2.id = sp2.supplier_id
                   WHERE sp2.id = pi.supplier_price_id) AS supplier_name
           FROM project_items pi
           JOIN products p ON p.id = pi.product_id
           WHERE pi.project_id = $1
           ORDER BY p.name"#,
        project_id
    )
    .fetch_all(pool)
    .await?
    .into_iter()
    .map(|r| ItemForCost {
        item_id: r.item_id,
        product_name: r.product_name,
        product_model: r.product_model,
        quantity: r.quantity,
        use_unit: r.use_unit,
        unit_price_snapshot: r.unit_price_snapshot,
        supplier_name: r.supplier_name,
    })
    .collect();
    Ok(rows)
}
