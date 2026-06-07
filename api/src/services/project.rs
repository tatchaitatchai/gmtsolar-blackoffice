use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    domain::project::{
        Project, ProjectCost, ProjectGroupCost, ProjectItem, ProjectItemCost, ProjectItemGroup,
        ProjectWithItems,
    },
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

pub async fn update_pricing(
    pool: &PgPool,
    id: Uuid,
    vat_percent: Decimal,
    overhead_percent: Decimal,
    show_overhead: bool,
    qt_number: Option<&str>,
) -> Result<Project, AppError> {
    repository::project::update_pricing(pool, id, vat_percent, overhead_percent, show_overhead, qt_number).await
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

pub async fn update_item_meta(
    pool: &PgPool,
    item_id: Uuid,
    markup_percent: Decimal,
    group_id: Option<Uuid>,
) -> Result<(), AppError> {
    repository::project::update_item_meta(pool, item_id, markup_percent, group_id).await
}

pub async fn list_groups(pool: &PgPool, project_id: Uuid) -> Result<Vec<ProjectItemGroup>, AppError> {
    repository::project::list_groups(pool, project_id).await
}

pub async fn create_group(
    pool: &PgPool,
    project_id: Uuid,
    name: &str,
    sort_order: i32,
) -> Result<ProjectItemGroup, AppError> {
    repository::project::create_group(pool, project_id, name, sort_order).await
}

pub async fn update_group(
    pool: &PgPool,
    id: Uuid,
    name: &str,
    custom_sell_price: Option<Decimal>,
    is_visible: bool,
) -> Result<ProjectItemGroup, AppError> {
    repository::project::update_group(pool, id, name, custom_sell_price, is_visible).await
}

pub async fn delete_group(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    repository::project::delete_group(pool, id).await
}

pub async fn import_package(
    pool: &PgPool,
    project_id: Uuid,
    package_id: Uuid,
    item_ids: &[Uuid],
) -> Result<(), AppError> {
    let pkg = repository::package::find_by_id(pool, package_id)
        .await?
        .ok_or(AppError::NotFound)?;

    for item in pkg.items.iter().filter(|i| item_ids.contains(&i.id)) {
        let cheapest = repository::project::find_cheapest_price_for_product(pool, item.product_id).await?;
        let (supplier_price_id, snapshot) = match cheapest {
            Some(cp) => {
                let ppu = match cp.units_per_purchase {
                    Some(upu) => cp.price / upu,
                    None => cp.price,
                };
                (Some(cp.supplier_price_id), ppu)
            }
            None => (None, Decimal::ZERO),
        };
        repository::project::add_item(
            pool,
            project_id,
            item.product_id,
            supplier_price_id,
            item.quantity,
            snapshot,
        )
        .await?;
    }

    Ok(())
}

pub async fn cost(pool: &PgPool, id: Uuid) -> Result<ProjectCost, AppError> {
    let proj = repository::project::find_by_id(pool, id)
        .await?
        .ok_or(AppError::NotFound)?;

    let rows = repository::project::find_items_for_cost(pool, id).await?;
    let groups = &proj.groups;

    let hundred = Decimal::from(100);

    let mut all_items: Vec<ProjectItemCost> = rows
        .into_iter()
        .map(|r| {
            let cost = r.unit_price_snapshot * r.quantity;
            let sell_price = cost * (Decimal::ONE + r.markup_percent / hundred);
            ProjectItemCost {
                item_id: r.item_id,
                product_name: r.product_name,
                product_model: r.product_model,
                quantity: r.quantity,
                use_unit: r.use_unit,
                unit_price_snapshot: r.unit_price_snapshot,
                markup_percent: r.markup_percent,
                cost,
                sell_price,
                supplier_name: r.supplier_name,
                group_id: r.group_id,
            }
        })
        .collect();

    let mut total_cost = Decimal::ZERO;
    let mut total_sell_price = Decimal::ZERO;

    let grouped: Vec<ProjectGroupCost> = groups
        .iter()
        .map(|g| {
            let items: Vec<ProjectItemCost> = all_items
                .iter()
                .filter(|i| i.group_id == Some(g.id))
                .cloned()
                .collect();

            let group_cost: Decimal = items.iter().map(|i| i.cost).sum();
            let items_sell_sum: Decimal = items.iter().map(|i| i.sell_price).sum();
            let group_sell_price = g.custom_sell_price.unwrap_or(items_sell_sum);

            total_cost += group_cost;
            total_sell_price += group_sell_price;

            ProjectGroupCost {
                group_id: g.id,
                name: g.name.clone(),
                custom_sell_price: g.custom_sell_price,
                is_visible: g.is_visible,
                items,
                group_cost,
                group_sell_price,
            }
        })
        .collect();

    all_items.retain(|i| i.group_id.is_none());

    for item in &all_items {
        total_cost += item.cost;
        total_sell_price += item.sell_price;
    }

    let overhead_amount = if proj.show_overhead {
        total_sell_price * proj.overhead_percent / hundred
    } else {
        Decimal::ZERO
    };
    let pre_vat = total_sell_price + overhead_amount;
    let vat_amount = pre_vat * proj.vat_percent / hundred;
    let grand_total = pre_vat + vat_amount;

    Ok(ProjectCost {
        project_id: proj.id,
        project_name: proj.name,
        total_cost,
        total_sell_price,
        vat_percent: proj.vat_percent,
        overhead_percent: proj.overhead_percent,
        show_overhead: proj.show_overhead,
        qt_number: proj.qt_number,
        overhead_amount,
        vat_amount,
        grand_total,
        groups: grouped,
        ungrouped_items: all_items,
    })
}
