CREATE TABLE projects (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    customer_name TEXT,
    address       TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE project_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    product_id          UUID NOT NULL REFERENCES products(id),
    supplier_price_id   UUID REFERENCES supplier_prices(id) ON DELETE SET NULL,
    quantity            NUMERIC(12,4) NOT NULL,
    unit_price_snapshot NUMERIC(12,6) NOT NULL DEFAULT 0
);
