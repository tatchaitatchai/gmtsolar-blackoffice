#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub port: u16,
}

impl Config {
    pub fn from_env() -> Self {
        let _ = dotenvy::dotenv();

        Self {
            database_url: required("DATABASE_URL"),
            jwt_secret: required("JWT_SECRET"),
            port: std::env::var("PORT")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(8088),
        }
    }
}

fn required(key: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| panic!("missing required environment variable: {key}"))
}
