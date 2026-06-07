use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: Uuid,
    pub name: String,
    pub customer_name: Option<String>,
    pub address: Option<String>,
    pub vat_percent: Decimal,
    pub overhead_percent: Decimal,
    pub show_overhead: bool,
    pub qt_number: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectItem {
    pub id: Uuid,
    pub project_id: Uuid,
    pub product_id: Uuid,
    pub supplier_price_id: Option<Uuid>,
    pub quantity: Decimal,
    pub unit_price_snapshot: Decimal,
    pub markup_percent: Decimal,
    pub group_id: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProjectItemGroup {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub sort_order: i32,
    pub custom_sell_price: Option<Decimal>,
    pub is_visible: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProjectItemDetail {
    pub id: Uuid,
    pub product_id: Uuid,
    pub product_name: String,
    pub product_model: String,
    pub use_unit: String,
    pub quantity: Decimal,
    pub supplier_price_id: Option<Uuid>,
    pub supplier_name: Option<String>,
    pub unit_price_snapshot: Decimal,
    pub markup_percent: Decimal,
    pub group_id: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProjectWithItems {
    pub id: Uuid,
    pub name: String,
    pub customer_name: Option<String>,
    pub address: Option<String>,
    pub vat_percent: Decimal,
    pub overhead_percent: Decimal,
    pub show_overhead: bool,
    pub qt_number: Option<String>,
    pub created_at: DateTime<Utc>,
    pub items: Vec<ProjectItemDetail>,
    pub groups: Vec<ProjectItemGroup>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProjectItemCost {
    pub item_id: Uuid,
    pub product_name: String,
    pub product_model: String,
    pub quantity: Decimal,
    pub use_unit: String,
    pub unit_price_snapshot: Decimal,
    pub markup_percent: Decimal,
    pub cost: Decimal,
    pub sell_price: Decimal,
    pub supplier_name: Option<String>,
    pub group_id: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProjectGroupCost {
    pub group_id: Uuid,
    pub name: String,
    pub custom_sell_price: Option<Decimal>,
    pub is_visible: bool,
    pub items: Vec<ProjectItemCost>,
    pub group_cost: Decimal,
    pub group_sell_price: Decimal,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProjectCost {
    pub project_id: Uuid,
    pub project_name: String,
    pub total_cost: Decimal,
    pub total_sell_price: Decimal,
    pub vat_percent: Decimal,
    pub overhead_percent: Decimal,
    pub show_overhead: bool,
    pub qt_number: Option<String>,
    pub overhead_amount: Decimal,
    pub vat_amount: Decimal,
    pub grand_total: Decimal,
    pub groups: Vec<ProjectGroupCost>,
    pub ungrouped_items: Vec<ProjectItemCost>,
}
