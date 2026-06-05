use axum::{extract::{Request, State}, middleware::Next, response::Response};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{error::AppError, state::AppState};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: Uuid,
    pub email: String,
    pub name: String,
    pub exp: u64,
}

const JWT_EXPIRY_SECS: u64 = 60 * 60 * 24 * 7;

pub fn encode_jwt(secret: &str, user_id: Uuid, email: &str, name: &str) -> Result<String, AppError> {
    let exp = jsonwebtoken::get_current_timestamp() + JWT_EXPIRY_SECS;
    let claims = Claims { sub: user_id, email: email.to_string(), name: name.to_string(), exp };
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|_| AppError::Internal(anyhow::anyhow!("failed to encode JWT")))
}

pub fn decode_jwt(secret: &str, token: &str) -> Result<Claims, AppError> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .map_err(|_| AppError::Unauthorized)
}

pub async fn jwt_middleware(
    State(state): State<AppState>,
    mut req: Request,
    next: Next,
) -> Result<Response, AppError> {
    let token = req
        .headers()
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .ok_or(AppError::Unauthorized)?;

    let claims = decode_jwt(&state.jwt_secret, token)?;
    req.extensions_mut().insert(claims);

    Ok(next.run(req).await)
}
