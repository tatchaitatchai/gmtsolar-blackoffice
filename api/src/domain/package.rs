use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Package {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageItem {
    pub id: Uuid,
    pub package_id: Uuid,
    pub product_id: Uuid,
    pub quantity: Decimal,
}

#[derive(Debug, Clone, Serialize)]
pub struct PackageItemDetail {
    pub id: Uuid,
    pub product_id: Uuid,
    pub product_name: String,
    pub product_model: String,
    pub use_unit: String,
    pub quantity: Decimal,
}

#[derive(Debug, Clone, Serialize)]
pub struct PackageWithItems {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub items: Vec<PackageItemDetail>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PackageItemCost {
    pub item_id: Uuid,
    pub product_id: Uuid,
    pub product_name: String,
    pub product_model: String,
    pub quantity: Decimal,
    pub use_unit: String,
    pub price_per_use_unit: Option<Decimal>,
    pub cost: Option<Decimal>,
    pub supplier_id: Option<Uuid>,
    pub supplier_name: Option<String>,
    pub has_price: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct PackageCost {
    pub package_id: Uuid,
    pub package_name: String,
    pub total_cost: Decimal,
    pub items: Vec<PackageItemCost>,
}
