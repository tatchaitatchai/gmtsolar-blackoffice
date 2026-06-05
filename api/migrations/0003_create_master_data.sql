CREATE TABLE categories (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE brands (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE suppliers (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    contact    TEXT,
    note       TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id        UUID NOT NULL REFERENCES categories(id),
    brand_id           UUID NOT NULL REFERENCES brands(id),
    name               TEXT NOT NULL,
    model              TEXT NOT NULL DEFAULT '',
    spec               JSONB NOT NULL DEFAULT '{}',
    use_unit           TEXT NOT NULL,
    purchase_unit      TEXT,
    units_per_purchase NUMERIC,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
