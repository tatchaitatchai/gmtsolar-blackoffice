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
- Money is stored as `NUMERIC(12,2)` in Postgres ↔ `rust_decimal::Decimal` in Rust. **Never use float for money.**
- Old folders `admin-fe/`, `admin-api/`, `pricing/`, `spec/`, `image_souce/` are **legacy — ignore them.** All new work lives in `api/` and `web/`. (`image_souce/` does hold real product photos/logos if assets are needed later.)

## Three deviations from the original plan (already agreed with user)

1. **No unit tests** — do not add them.
2. **Cable is a normal material**, not a special case. Modeled via `purchase_unit` + `units_per_purchase` on `products` (e.g. roll = 100 m). Any material bought in bulk and used by sub-unit works the same way.
3. **No register page** — only Login. There are just 3 users; they are seeded into the DB directly.

## Component library

UI components come from **Ecme - React Tailwind Admin Template**  
`/Users/mindtatchai/Developer/freelance_work/rb7/Ecme - React Tailwind Admin Template/starter/src/components/ui/`

Before writing new component usage, look at the template source first. Key patterns:
- `<Input prefix={<HiOutlineSearch />} />` — puts icon inside input; **search inputs must always use this**
- `<Select isSearchable />` — react-select wrapper; searchable by default, but **always set `isSearchable` explicitly on filter/search dropdowns**
- Input also supports `suffix`, `size`, `invalid`, `textArea` props — check `Input.tsx` before reaching for a wrapper div

## Tech stack

- **Backend** `api/` — Rust + **Axum 0.8** + **SQLx 0.8** (Postgres) + jsonwebtoken + argon2. Axum 0.8 path params use `{id}` syntax, not `:id`.
- **Frontend** `web/` — React + Vite + TypeScript + **Tailwind CSS v4** (via `@tailwindcss/vite` plugin; CSS is just `@import "tailwindcss";`). Responsive / mobile-first, intended as a PWA.
- **DB** — PostgreSQL 16 in Docker (`docker-compose.dev.yml`).
- **Deploy** — VPS `159.65.135.66`, domain `admin.gmt-solar.com`, via `docker-compose.prod.yml`. Use `/deploy-backoffice` skill.

## Environment gotchas

- **API runs on port `8088`, not 8080** — port 8080 is taken by another Docker container on this machine. Vite proxies `/api` → `http://localhost:8088` (see `web/vite.config.ts`).
- **Rust is installed via rustup** — run `source "$HOME/.cargo/env"` before any `cargo` command (non-login shells won't have it on PATH).
- `api/.env` exists (copied from `.env.example`). `DATABASE_URL=postgres://gmt:gmt_dev_password@localhost:5432/gmt_solar`.
- Node 20+, Docker, and Docker Compose are installed.
- **Frontend build**: `npm run build` in `web/` runs `tsc -b && vite build`. The `tsc -b` step fails on unused Ecme template files. For production deploy, use `npx vite build` directly (Vite handles TS via esbuild without strict type-check).

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
    0002_seed_users.sql          — seed 1 admin user (mindtatchai34@gmail.com)
    0003_create_master_data.sql  — categories, brands, suppliers, products tables
    0004_seed_categories.sql     — อินเวอร์เตอร์, แบตเตอรี่, โซล่าเซลล์, โครงยึด, สายไฟ, อุปกรณ์เสริม
    0005_create_supplier_prices.sql
    0006_create_packages.sql     — packages + package_items tables
    0007_create_projects.sql     — projects + project_items tables
    0008_seed_master_data.sql    — brands, suppliers, products, supplier_prices (real receipts)
    0009_seed_quotation_5069000114.sql — demo project from real quotation QT.5069000114
  src/
    main.rs          — bootstrap: config → DB → migrations → router → serve
    config.rs        — read env vars
    db.rs            — PgPool + run_migrations (sqlx::migrate! embeds at compile time)
    error.rs         — AppError enum → HTTP responses
    state.rs         — AppState { pool, jwt_secret }
    auth/
      mod.rs         — JWT Claims struct, encode_jwt, decode_jwt, jwt_middleware
    domain/          — plain data structs (Serialize/Deserialize). No sqlx, no Axum.
      user.rs, category.rs, brand.rs, supplier.rs, supplier_price.rs
      product.rs     — Product + ProductDetail (with prices)
      package.rs     — Package + PackageWithItems + PackageCost
      project.rs     — Project + ProjectWithItems + ProjectCost
    routes/
      mod.rs         — Router assembly: public (no JWT) vs protected (jwt_middleware via route_layer)
    handlers/        — parse HTTP → call service → return response; DTOs live here
      auth.rs, health.rs, category.rs, brand.rs, supplier.rs
      product.rs     — includes supplier_price handlers
      supplier_price.rs
      package.rs     — includes package_items handlers
      project.rs     — includes project_items handlers
    services/        — business logic; no Axum types
      auth.rs, category.rs, brand.rs, supplier.rs, product.rs, supplier_price.rs
      package.rs     — cost calc: pick cheapest price per item, sum
      project.rs     — cost calc: use unit_price_snapshot × quantity, sum
    repository/      — DB queries only
      user.rs, category.rs, brand.rs, supplier.rs, product.rs, supplier_price.rs
      package.rs, project.rs
web/
  vite.config.ts     — react + tailwind plugins, /api proxy → :8088
  src/
    main.tsx
    App.tsx          — BrowserRouter + AuthProvider + Routes
    index.css        — @import "tailwindcss"
    lib/
      api.ts         — fetch wrapper, auto-attaches JWT from localStorage
      auth.tsx       — AuthProvider, useAuth hook
      usePagination.ts — generic pagination hook (page, pageSize, slice)
    pages/           — thin route entry points (lazy-load from views/)
      LoginPage.tsx, CategoriesPage.tsx, BrandsPage.tsx
      SuppliersPage.tsx, ProductsPage.tsx
    views/           — actual page components (all logic lives here)
      categories/CategoriesPage.tsx  — CRUD table + dialog
      brands/BrandsPage.tsx          — CRUD table + dialog
      suppliers/SuppliersPage.tsx    — CRUD table + dialog
      products/ProductsPage.tsx      — CRUD table + dialog + filter by category/brand
      prices/PricesPage.tsx          — price compare per product (all suppliers, cheapest flag)
      packages/PackagesPage.tsx      — package CRUD + items + cost dialog
      projects/ProjectsPage.tsx      — project CRUD + items + cost dialog (scroll fix applied)
docker-compose.dev.yml
docker-compose.prod.yml
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

## Data model (all migrated ✅)

Money = NUMERIC(12,2). IDs = UUID (`gen_random_uuid()`).

- **users**(id, email unique, password_hash, name, created_at)
- **categories**(id, name) — อินเวอร์เตอร์, แบตเตอรี่, โซล่าเซลล์, โครงยึด, สายไฟ, อุปกรณ์เสริม, บริการ
- **brands**(id, name) — Deye, SolarEdge, JA Solar, Longi, YAZAKI, LAPP, Panasonic, TDP, ทั่วไป
- **products**(id, category_id, brand_id, name, model, spec jsonb, **use_unit**, **purchase_unit** NULL, **units_per_purchase** numeric NULL, created_at)
  - normal product: purchase_unit/units_per_purchase NULL (price per use_unit)
  - bulk product (cable, ferrule): purchase_unit=ม้วน/ชุด, units_per_purchase=100 etc.
- **suppliers**(id, name, contact, note, created_at) — 7+ real suppliers seeded from receipts
- **supplier_prices**(id, product_id, supplier_id, price numeric, note, effective_date, created_at)
  - price is per **purchase_unit** if set, else per **use_unit**
  - **price per use_unit** = `price / units_per_purchase` (if set) else `price`
- **packages**(id, name, description, created_at)
- **package_items**(id, package_id, product_id, quantity numeric)
- **projects**(id, name, customer_name, address, created_at)
- **project_items**(id, project_id, product_id, supplier_price_id NULL, quantity, unit_price_snapshot numeric)
  - quantity is in use_unit (cable = meters actually used)
  - unit_price_snapshot = price_per_use_unit at time of adding item (survives future price changes)

## Calculation rules (in `api/src/services/`)

- **price per use unit** = `supplier_price.price / units_per_purchase` (if set) else `price`
- **item cost** = `price_per_use_unit × quantity`
- **package cost** = for each item, pick cheapest available supplier price, sum all
- **project cost** = sum of `unit_price_snapshot × quantity` (uses locked snapshot, not live prices)
- **price comparison** = all supplier_prices for a product, converted to price-per-use-unit, sorted cheapest→dearest, flag the cheapest

## API (all built ✅)

All routes except auth require JWT (`Authorization: Bearer <token>`).

- `POST /api/auth/login` — `{email, password}` → `{token, user}`
- `GET  /api/auth/me` — returns current user from JWT
- `GET/POST/PUT/DELETE /api/categories/:id`
- `GET/POST/PUT/DELETE /api/brands/:id`
- `GET/POST/PUT/DELETE /api/suppliers/:id`
- `GET/POST/PUT/DELETE /api/products/:id`
- `GET/POST           /api/products/:id/prices` — GET returns price-per-use-unit + `is_cheapest` flag
- `DELETE             /api/supplier_prices/:id`
- `GET/POST/PUT/DELETE /api/packages/:id`
- `GET/POST           /api/packages/:id/items`
- `DELETE             /api/package_items/:id`
- `GET                /api/packages/:id/cost`
- `GET/POST/PUT/DELETE /api/projects/:id`
- `GET/POST           /api/projects/:id/items`
- `DELETE             /api/project_items/:id`
- `GET                /api/projects/:id/cost`

## Frontend pages (all built ✅)

All pages are under `web/src/views/`. Routes wired in `web/src/configs/navigation.config/`.

| Route | View | Description |
|---|---|---|
| `/sign-in` | auth/SignIn | Login with JWT |
| `/categories` | categories/CategoriesPage | CRUD |
| `/brands` | brands/BrandsPage | CRUD |
| `/suppliers` | suppliers/SuppliersPage | CRUD |
| `/products` | products/ProductsPage | CRUD + filter |
| `/prices` | prices/PricesPage | Price compare per product |
| `/packages` | packages/PackagesPage | Package builder + cost |
| `/projects` | projects/ProjectsPage | Project tracker + cost |

## Roadmap / progress

- [x] **Phase 0** — Scaffold + FE↔API↔DB wired + health check.
- [x] **Phase 1** — Login (JWT + Argon2), seed user, React Login page + token storage.
- [x] **Phase 2** — Master data CRUD (categories, brands, products, suppliers) + UI.
- [x] **Phase 3** — supplier_prices + price-per-use-unit calc + Price Compare page.
- [x] **Phase 4** — Packages (bundle + mix + cost) + UI.
- [x] **Phase 5** — Projects (project_items + full cost incl. cable-by-meter) + UI.
- [x] **Phase 6** — Deploy: `docker-compose.prod.yml`, VPS `159.65.135.66`, `admin.gmt-solar.com`.
- [ ] **Later** — Quotation PDF export.
