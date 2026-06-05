# CLAUDE.md — GMT Solar

Guidance for Claude Code when working in this repo. Read this first.

## What this is

Back-office system for a **solar-installation business**. Core goals:

1. **Cost calculation** — bundle products into **packages** (e.g. Huawei, Deye) and **mix across brands** (e.g. Huawei inverter + Deye battery).
2. **Cable/wire costing** — cable is bought by the roll but a job uses only part of it. Cost only the meters actually used: `price_per_roll ÷ meters_per_roll × meters_used`.
3. **Vendor price comparison** — add "suppliers" (เจ้า) and record each one's price for the same product, to see who is cheapest.
4. (Future) **Quotation PDF** — not built yet, but the data model is designed to allow it later.

## Who the user is / how to work

- The user **wants to learn** — they are building this partly to study React + Rust.
- **Explain in Thai.** Write zero code comments — not in Thai, not in English.
- **Work phase by phase** (see Roadmap). Build small, verify, then explain what was built before moving on.
- The user often wants to **see the result in the browser** between phases.

## Hard rules

- **No `Co-Authored-By: Claude`** in commit messages (user memory rule).
- This directory is **NOT a git repo** yet. If committing is needed, `git init` first and ask.
- Money is stored as `NUMERIC(12,2)` in Postgres ↔ `rust_decimal::Decimal` in Rust. **Never use float for money.**
- Old folders `admin-fe/`, `admin-api/`, `pricing/`, `spec/`, `image_souce/` are **legacy — ignore them.** All new work lives in `api/` and `web/`. (`image_souce/` does hold real product photos/logos if assets are needed later.)

## Three deviations from the original plan (already agreed with user)

1. **No unit tests** — do not add them.
2. **Cable is a normal material**, not a special case. Modeled via `purchase_unit` + `units_per_purchase` on `products` (e.g. roll = 100 m). Any material bought in bulk and used by sub-unit works the same way.
3. **No register page** — only Login. There are just 3 users; they are seeded into the DB directly.

## Tech stack

- **Backend** `api/` — Rust + **Axum 0.8** + **SQLx 0.8** (Postgres) + jsonwebtoken + argon2. Axum 0.8 path params use `{id}` syntax, not `:id`.
- **Frontend** `web/` — React + Vite + TypeScript + **Tailwind CSS v4** (via `@tailwindcss/vite` plugin; CSS is just `@import "tailwindcss";`). Responsive / mobile-first, intended as a PWA.
- **DB** — PostgreSQL 16 in Docker (`docker-compose.dev.yml`).
- **Deploy target** — cheap VPS via Docker Compose (Phase 6, not done yet).

## Environment gotchas

- **API runs on port `8088`, not 8080** — port 8080 is taken by another Docker container on this machine. Vite proxies `/api` → `http://localhost:8088` (see `web/vite.config.ts`).
- **Rust is installed via rustup** — run `source "$HOME/.cargo/env"` before any `cargo` command (non-login shells won't have it on PATH).
- `api/.env` exists (copied from `.env.example`). `DATABASE_URL=postgres://gmt:gmt_dev_password@localhost:5432/gmt_solar`.
- Node 20+, Docker, and Docker Compose are installed.

## Run the dev stack

```bash
# 1) Postgres
docker compose -f docker-compose.dev.yml up -d

# 2) API (port 8088)
cd api && source "$HOME/.cargo/env" && cargo run

# 3) Frontend (port 5173)
cd web && npm run dev
```

Then open http://localhost:5173. Health check: `curl http://localhost:8088/api/health` →
`{"database":"connected","status":"ok"}`.

## Project layout

```
api/
  Cargo.toml
  .env / .env.example
  migrations/
    0001_create_users.sql
    0002_seed_users.sql
  src/
    main.rs          — bootstrap: config → DB → migrations → router → serve
    config.rs        — read env vars
    db.rs            — PgPool + run_migrations
    error.rs         — AppError enum → HTTP responses
    state.rs         — AppState { pool, jwt_secret }
    auth/
      mod.rs         — JWT Claims struct, encode_jwt, decode_jwt
    domain/          — plain data structs, no logic, no DB, no HTTP types
      mod.rs
      user.rs        — User { id, email, name }
    routes/
      mod.rs         — Router assembly only (path → handler mapping)
    handlers/        — parse HTTP request, call service, return response; DTOs live here
      mod.rs
      auth.rs        — LoginRequest, LoginResponse, login(), me()
      health.rs      — health()
    services/        — business logic; calls repository, returns domain structs
      mod.rs
      auth.rs        — login(): verify password → encode JWT → return (token, User)
    repository/      — DB queries only; returns domain structs or raw records
      mod.rs
      user.rs        — find_by_email()
web/
  vite.config.ts     — react + tailwind plugins, /api proxy → :8088
  src/
    main.tsx
    App.tsx          — BrowserRouter + AuthProvider + Routes
    index.css        — @import "tailwindcss"
    lib/
      api.ts         — fetch wrapper, auto-attaches JWT from localStorage
      auth.tsx       — AuthProvider, useAuth hook
    pages/
      LoginPage.tsx
docker-compose.dev.yml
```

## Backend code structure rules

```
request → routes/ → handlers/ → services/ → repository/ → DB
                                    ↕
                                 domain/
```

- **`routes/`** — path-to-handler mapping only. Split into `public` (no JWT) and `protected` (JWT middleware applied via `route_layer`). No logic, no types.
- **`handlers/`** — parse HTTP input → call one service fn → serialize response. Request/response DTOs live here. Protected handlers get `Extension<Claims>` automatically from middleware.
- **`services/`** — business logic. Takes primitive params, calls repository, returns `domain` types or `AppError`. No Axum types.
- **`repository/`** — DB queries only. Takes `&PgPool` + params, returns domain structs or internal records. No HTTP, no business logic.
- **`domain/`** — plain data structs (`Serialize`/`Deserialize` allowed). No `sqlx`, no Axum, no logic.
- **`auth/`** — JWT utilities: `encode_jwt`, `decode_jwt`, `Claims` struct, and `jwt_middleware` (validates token → injects `Claims` into request extensions).

## Data model (target — only `users` migration exists so far)

Design these as migrations are added. Money = NUMERIC(12,2). IDs = UUID (`gen_random_uuid()`).

- **users**(id, email unique, password_hash, name, created_at) ✅ migrated
- **categories**(id, name) — Inverter, Battery, Panel, Mounting, Cable, Accessory
- **brands**(id, name) — Huawei, Deye
- **products**(id, category_id, brand_id, name, model, spec jsonb, **use_unit**, **purchase_unit** NULL, **units_per_purchase** numeric NULL, created_at)
  - normal product: purchase_unit/units_per_purchase NULL (1:1)
  - cable: use_unit=เมตร, purchase_unit=ม้วน, units_per_purchase=meters-per-roll
- **suppliers**(id, name, contact, note) — the "เจ้า"
- **supplier_prices**(id, product_id, supplier_id, price numeric, note, effective_date, created_at)
  - price is per **purchase unit** if set (per roll), else per use_unit
  - **price per use unit** = `price / units_per_purchase` (if set) else `price`
- **packages**(id, name, description, created_at)
- **package_items**(id, package_id, product_id, quantity numeric)  — mixing brands is free since each item is any product
- **projects**(id, name, customer_name, address, created_at)  — "บ้านหลังนี้"
- **project_items**(id, project_id, product_id, supplier_price_id NULL, quantity, unit_price_snapshot numeric)
  - quantity is in use_unit (cable = meters actually used); snapshot the unit price to survive later price changes

## Calculation rules (live in `api/src/services/`)

- **price per use unit** = `supplier_price.price / units_per_purchase` (if set) else `price`
- **item cost** = `price_per_use_unit × quantity`  (cable: meters used → only what's used)
- **package/project total** = sum of item costs
- **price comparison** = all supplier_prices for a product, converted to price-per-use-unit, sorted cheapest→dearest, flag the cheapest
- **package cheapest cost** = for each item pick the cheapest available supplier price, then sum

## Planned API (Axum) — only `/api/health` exists today

- Auth: `POST /api/auth/login` (returns JWT), `GET /api/auth/me` — **no register**
- CRUD: `/api/categories`, `/api/brands`, `/api/suppliers`, `/api/products`
- Prices: `GET/POST /api/products/:id/prices` (GET returns price-per-use-unit + cheapest flag)
- Packages: CRUD `/api/packages` (+ items), `GET /api/packages/:id/cost`
- Projects: CRUD `/api/projects` (+ items), `GET /api/projects/:id/cost`
- All routes except auth require a valid JWT (middleware).

## Frontend pages (planned) — only the Phase 0 health page exists

Login → app shell (desktop sidebar / mobile bottom-nav) → Products, Suppliers, Price Compare,
Packages, Projects. Mobile-first Tailwind.

## Roadmap / progress

- [x] **Phase 0** — Scaffold + FE↔API↔DB wired + health check. **DONE & verified.**
- [x] **Phase 1** — Login (JWT + Argon2), seed user, React Login page + token storage. **DONE.**
- [ ] **Phase 2** — Master data CRUD (categories, brands, products incl. bulk-unit, suppliers) + UI. **← NEXT**
- [ ] **Phase 3** — supplier_prices + price-per-use-unit calc + Price Compare page
- [ ] **Phase 4** — Packages (bundle + mix + cost) + UI
- [ ] **Phase 5** — Projects (project_items + full cost incl. cable-by-meter) + UI
- [ ] **Phase 6** — Deploy: production docker-compose (postgres + api + web/nginx), VPS, PWA
- [ ] **Later** — Quotation PDF

