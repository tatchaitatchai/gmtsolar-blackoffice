# GMT Solar — Back-office Cost Calculator

Back-office system for a solar installation business: calculate costs, bundle products into packages, mix across brands, calculate cable by meters used, and compare supplier prices.

## Structure

- `api/` — Backend: **Rust + Axum + SQLx + PostgreSQL**
- `web/` — Frontend: **React + Vite + TypeScript + Tailwind CSS** (responsive / mobile-first)
- `docker-compose.dev.yml` — Postgres for local development

## Prerequisites

- [Rust](https://rustup.rs) (stable via rustup)
- Node.js 20+
- Docker + Docker Compose

## Running in development

Open 3 terminals:

```bash
# 1) Postgres
docker compose -f docker-compose.dev.yml up -d

# 2) Backend API  (port 8088)
cd api
cp .env.example .env        # first time only
cargo run

# 3) Frontend  (port 5173)
cd web
npm install                 # first time only
npm run dev
```

Then open **http://localhost:5173**

Health check: `curl http://localhost:8088/api/health` → `{"status":"ok","database":"connected"}`

## Port notes

- API runs on **8088** (not 8080 — port 8080 is occupied by another container on this machine)
- The Vite dev server proxies `/api/*` to the API automatically

## Roadmap

- [x] **Phase 0** — Scaffold + FE↔API↔DB wired + health check
- [ ] **Phase 1** — Login (JWT + Argon2) + seed 3 users
- [ ] **Phase 2** — Master data CRUD (categories, brands, products, suppliers)
- [ ] **Phase 3** — Supplier prices + price-per-use-unit + price comparison
- [ ] **Phase 4** — Packages (bundle + mix across brands + cost)
- [ ] **Phase 5** — Projects (full cost calculation incl. cable-by-meter)
- [ ] **Phase 6** — Deploy to VPS (Docker Compose + nginx)
