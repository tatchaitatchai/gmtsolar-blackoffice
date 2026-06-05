use axum::{middleware, routing::{delete, get, post, put}, Router};
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

use crate::{auth, handlers, state::AppState};

pub fn router(state: AppState) -> Router {
    let public = Router::new()
        .route("/api/health", get(handlers::health::health))
        .route("/api/auth/login", post(handlers::auth::login));

    let protected = Router::new()
        .route("/api/auth/me", get(handlers::auth::me))
        .route("/api/categories", get(handlers::category::list).post(handlers::category::create))
        .route("/api/categories/{id}", put(handlers::category::update).delete(handlers::category::delete))
        .route("/api/brands", get(handlers::brand::list).post(handlers::brand::create))
        .route("/api/brands/{id}", put(handlers::brand::update).delete(handlers::brand::delete))
        .route("/api/suppliers", get(handlers::supplier::list).post(handlers::supplier::create))
        .route("/api/suppliers/{id}", put(handlers::supplier::update).delete(handlers::supplier::delete))
        .route("/api/products", get(handlers::product::list).post(handlers::product::create))
        .route("/api/products/{id}", put(handlers::product::update).delete(handlers::product::delete))
        .route("/api/products/{id}/prices", get(handlers::supplier_price::list).post(handlers::supplier_price::create))
        .route("/api/prices/{id}", delete(handlers::supplier_price::delete))
        .route("/api/packages", get(handlers::package::list).post(handlers::package::create))
        .route("/api/packages/{id}", get(handlers::package::get).put(handlers::package::update).delete(handlers::package::delete))
        .route("/api/packages/{id}/items", post(handlers::package::add_item))
        .route("/api/packages/{id}/cost", get(handlers::package::cost))
        .route("/api/package_items/{id}", delete(handlers::package::remove_item))
        .route("/api/projects", get(handlers::project::list).post(handlers::project::create))
        .route("/api/projects/{id}", get(handlers::project::get).put(handlers::project::update).delete(handlers::project::delete))
        .route("/api/projects/{id}/items", post(handlers::project::add_item))
        .route("/api/projects/{id}/cost", get(handlers::project::cost))
        .route("/api/project_items/{id}", delete(handlers::project::remove_item))
        .route_layer(middleware::from_fn_with_state(state.clone(), auth::jwt_middleware));

    Router::new()
        .merge(public)
        .merge(protected)
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}
