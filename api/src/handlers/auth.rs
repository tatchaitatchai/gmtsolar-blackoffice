use axum::{extract::State, Extension, Json};
use serde::{Deserialize, Serialize};

use crate::{auth::Claims, domain::user::User, error::AppError, services, state::AppState};

#[derive(Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user: User,
}

pub async fn login(
    State(state): State<AppState>,
    Json(body): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, AppError> {
    let (token, user) =
        services::auth::login(&state.pool, &state.jwt_secret, &body.email, &body.password).await?;

    Ok(Json(LoginResponse { token, user }))
}

pub async fn me(Extension(claims): Extension<Claims>) -> Result<Json<User>, AppError> {
    Ok(Json(User { id: claims.sub, email: claims.email, name: claims.name }))
}
