# GMT Solar — ระบบหลังบ้านคำนวณต้นทุน

ระบบสำหรับธุรกิจติดตั้งโซลาร์: คำนวณต้นทุน จัด package, mix ข้ามยี่ห้อ,
คำนวณสายไฟ (คิดเฉพาะเมตรที่ใช้) และเปรียบเทียบราคาแต่ละเจ้า

## โครงสร้าง

- `api/` — Backend: **Rust + Axum + SQLx + PostgreSQL**
- `web/` — Frontend: **React + Vite + TypeScript + Tailwind CSS** (responsive)
- `docker-compose.dev.yml` — Postgres สำหรับตอนพัฒนา

## ต้องมีอะไรบ้าง

- [Rust](https://rustup.rs) (stable)
- Node.js 20+
- Docker + Docker Compose

## วิธีรันตอนพัฒนา (dev)

เปิด 3 อย่างนี้ (คนละเทอร์มินัล):

```bash
# 1) ฐานข้อมูล Postgres
docker compose -f docker-compose.dev.yml up -d

# 2) Backend API  (พอร์ต 8088)
cd api
cp .env.example .env        # ครั้งแรกเท่านั้น
cargo run

# 3) Frontend  (พอร์ต 5173)
cd web
npm install                 # ครั้งแรกเท่านั้น
npm run dev
```

จากนั้นเปิดเบราว์เซอร์ที่ **http://localhost:5173**

## หมายเหตุพอร์ต

- API ใช้ **8088** (ไม่ใช่ 8080 เพราะเครื่องนี้มี Docker ตัวอื่นจอง 8080 อยู่)
- Frontend เรียก `/api/*` แล้ว Vite proxy ส่งต่อไป API ให้อัตโนมัติ

## ความคืบหน้า (ตามแผนเป็นเฟส)

- [x] **Phase 0** — วางโครง + เชื่อม FE↔API↔DB + health check
- [ ] **Phase 1** — Login (JWT) + seed ผู้ใช้ 3 คน
- [ ] **Phase 2** — Master data (หมวด/ยี่ห้อ/สินค้า/เจ้า)
- [ ] **Phase 3** — ราคา + เปรียบเทียบเจ้า
- [ ] **Phase 4** — Packages (จัดชุด + mix)
- [ ] **Phase 5** — Projects (คำนวณต้นทุนทั้งบ้าน)
- [ ] **Phase 6** — Deploy ขึ้น VPS
