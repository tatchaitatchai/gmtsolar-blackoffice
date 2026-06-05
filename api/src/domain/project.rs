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
}

#[derive(Debug, Clone, Serialize)]
pub struct ProjectWithItems {
    pub id: Uuid,
    pub name: String,
    pub customer_name: Option<String>,
    pub address: Option<String>,
    pub created_at: DateTime<Utc>,
    pub items: Vec<ProjectItemDetail>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProjectItemCost {
    pub item_id: Uuid,
    pub product_name: String,
    pub product_model: String,
    pub quantity: Decimal,
    pub use_unit: String,
    pub unit_price_snapshot: Decimal,
    pub cost: Decimal,
    pub supplier_name: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProjectCost {
    pub project_id: Uuid,
    pub project_name: String,
    pub total_cost: Decimal,
    pub items: Vec<ProjectItemCost>,
}
