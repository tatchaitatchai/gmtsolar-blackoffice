use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SupplierPrice {
    pub id: Uuid,
    pub product_id: Uuid,
    pub supplier_id: Uuid,
    pub price: Decimal,
    pub note: Option<String>,
    pub effective_date: Option<NaiveDate>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize)]
pub struct SupplierPriceEntry {
    pub id: Uuid,
    pub product_id: Uuid,
    pub supplier_id: Uuid,
    pub supplier_name: String,
    pub price: Decimal,
    pub price_per_use_unit: Decimal,
    pub use_unit: String,
    pub purchase_unit: Option<String>,
    pub units_per_purchase: Option<Decimal>,
    pub note: Option<String>,
    pub effective_date: Option<NaiveDate>,
    pub created_at: DateTime<Utc>,
    pub is_cheapest: bool,
}
