use argon2::{Argon2, PasswordHash, PasswordVerifier};
use sqlx::PgPool;

use crate::{auth as jwt, domain::user::User, error::AppError, repository};

pub async fn login(
    pool: &PgPool,
    jwt_secret: &str,
    email: &str,
    password: &str,
) -> Result<(String, User), AppError> {
    let record = repository::user::find_by_email(pool, email)
        .await?
        .ok_or(AppError::Unauthorized)?;

    let parsed_hash =
        PasswordHash::new(&record.password_hash).map_err(|_| AppError::Unauthorized)?;
    Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .map_err(|_| AppError::Unauthorized)?;

    let token = jwt::encode_jwt(jwt_secret, record.id, &record.email, &record.name)?;
    let user = User { id: record.id, email: record.email, name: record.name };

    Ok((token, user))
}
