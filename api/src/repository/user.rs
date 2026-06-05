use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppError;

pub struct UserRecord {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    pub password_hash: String,
}

pub async fn find_by_email(pool: &PgPool, email: &str) -> Result<Option<UserRecord>, AppError> {
    let row = sqlx::query!(
        "SELECT id, email, name, password_hash FROM users WHERE email = $1",
        email
    )
    .fetch_optional(pool)
    .await?
    .map(|r| UserRecord { id: r.id, email: r.email, name: r.name, password_hash: r.password_hash });

    Ok(row)
}
