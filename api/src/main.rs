mod auth;
mod config;
mod db;
mod domain;
mod error;
mod handlers;
mod repository;
mod routes;
mod services;
mod state;

use state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .init();

    let config = config::Config::from_env();

    let pool = db::connect(&config.database_url).await?;
    db::run_migrations(&pool).await?;
    tracing::info!("database connected and migrations applied");

    let state = AppState {
        pool,
        jwt_secret: config.jwt_secret,
    };

    let app = routes::router(state);

    let addr = format!("0.0.0.0:{}", config.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("API listening on http://{addr}");
    axum::serve(listener, app).await?;

    Ok(())
}

