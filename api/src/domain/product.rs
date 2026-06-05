use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Product {
    pub id: Uuid,
    pub category_id: Uuid,
    pub brand_id: Uuid,
    pub name: String,
    pub model: String,
    pub spec: serde_json::Value,
    pub use_unit: String,
    pub purchase_unit: Option<String>,
    pub units_per_purchase: Option<Decimal>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProductDetail {
    pub id: Uuid,
    pub category_id: Uuid,
    pub category_name: String,
    pub brand_id: Uuid,
    pub brand_name: String,
    pub name: String,
    pub model: String,
    pub spec: serde_json::Value,
    pub use_unit: String,
    pub purchase_unit: Option<String>,
    pub units_per_purchase: Option<Decimal>,
    pub created_at: DateTime<Utc>,
}
