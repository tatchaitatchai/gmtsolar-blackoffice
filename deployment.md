# Deployment Guide — GMT Solar Back-office

## สรุปแบบสั้น

**ไม่มี auto-sync** — ต้อง deploy เองทุกครั้งที่อยากขึ้น production
ใช้คำสั่ง `/deploy-backoffice` ใน Claude Code หรือรัน rsync + docker ด้วยมือตาม step ด้านล่าง

---

## Architecture บน Server

```
Internet
    │
    ▼
Cloudflare (DNS + proxy)
    │  admin.gmt-solar.com → 159.65.135.66
    ▼
[VPS: 159.65.135.66]
    │
    ▼
katom-membership-caddy  (Caddy reverse proxy, port 80/443)
    │
    ├─── admin.gmt-solar.com/api/*  ──▶  gmt-solar-api:8088
    │
    └─── admin.gmt-solar.com/*     ──▶  gmt-solar-web:80
              │
              └── nginx serving React SPA (dist/)

gmt-solar-api  ──▶  gmt-solar-db:5432 (Postgres)

(ทั้งหมดอยู่ใน Docker network: app_appnet)
```

### Container ที่มีอยู่บน server

| Container | Role |
|---|---|
| `katom-membership-caddy` | Reverse proxy หลัก, จัดการ HTTPS ทุก domain |
| `katom-membership-web` | Frontend ของโปรเจ็คอื่น (อย่าแตะ) |
| `katom-membership-api` | Backend ของโปรเจ็คอื่น (อย่าแตะ) |
| `katom-membership-postgres` | DB ของโปรเจ็คอื่น (อย่าแตะ) |
| `gmt-solar-web` | **React SPA** (nginx) ← ของเรา |
| `gmt-solar-api` | **Axum API** (Rust) ← ของเรา |
| `gmt-solar-db` | **Postgres 16** ← ของเรา |

---

## Deploy ทำงานยังไง (step by step)

### Step 1 — Build frontend บนเครื่องตัวเอง

```bash
cd web && npm run build
```

Vite compile TypeScript + bundle ทุก JS/CSS → ได้ไฟล์ static ใน `web/dist/`
ไฟล์พวกนี้จะถูกส่งขึ้น server ตรงๆ (ไม่ได้ build บน server)

**ทำไมถึง build บนเครื่องตัวเอง?**
เพราะ Node.js ไม่ได้ติดตั้งบน server และ build frontend เร็วมาก (< 1 นาที)
ส่ง dist/ ที่ build แล้วขึ้นไปดีกว่า

### Step 2 — Rsync ส่งไฟล์ขึ้น server

```bash
rsync -avz \
  --exclude='api/target/' \
  --exclude='web/node_modules/' \
  --exclude='.git/' \
  --exclude='**/.env' \
  ./ mind@159.65.135.66:/tmp/web-backoffice/
```

**rsync คืออะไร?**
คือ tool ที่ sync ไฟล์ผ่าน SSH โดย:
- ส่งเฉพาะไฟล์ที่ **เปลี่ยนแปลง** (ไม่ส่งซ้ำถ้าเหมือนเดิม)
- ส่งผ่าน SSH ที่เข้ารหัสอยู่แล้ว
- เร็วกว่า scp ธรรมดามากเพราะ diff ก่อน

ส่งไปที่ `/tmp/web-backoffice/` ก่อน (staging area) แล้วค่อย copy ไป `/root/app/web-backoffice/`
เพราะถ้า rsync ตรงไป `/root/` จะต้องใช้ sudo ตลอด

**ไฟล์ที่ไม่ส่ง:**
- `api/target/` — Rust build cache หนัก ~500MB ไม่จำเป็น (build ใหม่บน server)
- `web/node_modules/` — npm packages หนัก ~300MB (ไม่ต้องการบน server)
- `.env` — secret ไม่ commit/ส่ง เด็ดขาด
- `.git/` — git history ไม่จำเป็น

### Step 3 — Build Docker images บน server

```bash
docker compose -f docker-compose.prod.yml build
```

**gmt-solar-web** build เร็วมาก:
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/   # ← เอา dist/ ที่เรา build มาแล้ว
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

**gmt-solar-api** build นาน (~5-10 นาที) เพราะต้อง compile Rust:
```dockerfile
FROM rust:1.88-slim-bookworm AS builder
# ดาวน์โหลด dependencies ครั้งแรก (cache ไว้ build ครั้งต่อไปเร็วขึ้น)
COPY Cargo.toml Cargo.lock ./
RUN cargo build --release   # ← compile dependencies ทั้งหมด

# compile โค้ดของเรา
COPY src ./src
COPY .sqlx ./.sqlx          # ← type cache ของ SQLx (ไม่ต้องต่อ DB ตอน build)
ENV SQLX_OFFLINE=true
RUN cargo build --release   # ← compile แค่โค้ดเรา เร็วกว่ารอบแรกมาก

# copy binary เข้า image เล็กๆ (ไม่เอา Rust toolchain ไปด้วย)
FROM debian:bookworm-slim
COPY --from=builder /app/target/release/gmt-solar-api ./
```

**Multi-stage build** คือเทคนิคที่ใช้ image ใหญ่ (rust:1.88) ตอน build
แต่ image ที่ run จริงเล็กมาก (~100MB แทนที่จะเป็น ~2GB)

### Step 4 — Start containers

```bash
docker compose -f docker-compose.prod.yml up -d
```

`-d` = detached (run background)

ตอน `gmt-solar-api` start ครั้งแรก จะ **run migrations อัตโนมัติ**
(โค้ดใน `db.rs` เรียก `sqlx::migrate!()` ทุกครั้งที่ start)
ถ้า migration ผ่านแล้วก็จะ skip

### Step 5 — Caddy ทำงานยังไง

Caddy คือ reverse proxy ที่นั่งหน้าสุด รับทุก request แล้วส่งต่อไปหา container ที่ถูกต้อง

```
GET https://admin.gmt-solar.com/api/health
    │
    ▼ Caddy: /api/* → gmt-solar-api:8088
    │
    ▼ Axum API ตอบ {"status":"ok"}

GET https://admin.gmt-solar.com/packages
    │
    ▼ Caddy: /* → gmt-solar-web:80
    │
    ▼ nginx ส่ง index.html กลับไป
    │
    ▼ React Router จัดการ routing ฝั่ง browser
```

**HTTPS ฟรีอัตโนมัติ** — Caddy ใช้ Let's Encrypt ขอ SSL certificate ให้เองทุก domain
ไม่ต้อง config อะไรเพิ่ม แค่มี DNS record ชี้มาที่ server ก็พอ

---

## .sqlx/ คืออะไร ทำไมต้องมี

SQLx ปกติต้องต่อ database ตอน `cargo build` เพื่อ verify SQL query ว่า column ถูกต้อง
แต่ตอน build ใน Docker ไม่มี database → ต้อง pre-generate type cache ไว้

```bash
# รันบนเครื่องตัวเอง (ตอน local DB เปิดอยู่)
cargo sqlx prepare
```

สร้างไฟล์ JSON ใน `api/.sqlx/` หนึ่งไฟล์ต่อหนึ่ง query
เวลา build ใน Docker ตั้ง `SQLX_OFFLINE=true` → cargo อ่านจาก cache แทน

---

## docker-compose.prod.yml

```yaml
services:
  gmt-solar-db:      # Postgres — data เก็บใน volume
  gmt-solar-api:     # Rust API — รับ env DATABASE_URL + JWT_SECRET จาก .env
  gmt-solar-web:     # nginx — serve React SPA

networks:
  app_appnet:
    external: true   # ← join network เดิมที่ katom-membership ใช้อยู่
                     # ทำให้ Caddy (อยู่ใน network นี้) เข้าถึง container เราได้
```

**ทำไมต้อง external network?**
Caddy container (`katom-membership-caddy`) สร้างขึ้นมาก่อนพร้อมกับ network `app_appnet`
Container ของเราต้อง join network เดียวกันถึงจะ "มองเห็น" กันได้

---

## Production .env

ไฟล์ `/root/app/web-backoffice/.env` บน server (ไม่เคย commit):

```
DB_PASSWORD=...   # password ของ Postgres
JWT_SECRET=...    # key สำหรับ sign JWT token
```

ตอน deploy ครั้งแรกสร้างด้วยมือ ครั้งต่อไปไม่ต้องแตะ

---

## Deploy ครั้งต่อไป (หลัง code เปลี่ยน)

```bash
# 1. build frontend
cd web && npm run build && cd ..

# 2. ถ้าแก้ SQL query ใน Rust → regenerate cache
cd api && cargo sqlx prepare && cd ..

# 3. sync + build + restart
rsync -avz --exclude='api/target/' --exclude='web/node_modules/' \
  --exclude='.git/' --exclude='**/.env' \
  ./ mind@159.65.135.66:/tmp/web-backoffice/

ssh mind@159.65.135.66 'sudo bash -c "
  cp -r /tmp/web-backoffice/. /root/app/web-backoffice/
  cd /root/app/web-backoffice
  docker compose -f docker-compose.prod.yml build
  docker compose -f docker-compose.prod.yml up -d
"'
```

หรือใช้ `/deploy-backoffice` ใน Claude Code แทนก็ได้

---

## ทำไมไม่ใช้ CI/CD (GitHub Actions)?

ทำได้ แต่ซับซ้อนกว่า สำหรับโปรเจ็คขนาดนี้ rsync ง่ายกว่ามาก:
- ไม่ต้องตั้ง secret บน GitHub
- ไม่ต้องรอ queue
- deploy เมื่อพร้อมจริงๆ ไม่ใช่ทุก push

ถ้าอยากทำ CI/CD ภายหลัง: GitHub Actions → SSH → rsync → docker compose up
