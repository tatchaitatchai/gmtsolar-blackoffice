CREATE TABLE supplier_prices (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    supplier_id    UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    price          NUMERIC(12,2) NOT NULL,
    note           TEXT,
    effective_date DATE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
