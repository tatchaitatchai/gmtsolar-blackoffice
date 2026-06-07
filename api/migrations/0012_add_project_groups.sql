ALTER TABLE project_items ADD COLUMN IF NOT EXISTS markup_percent NUMERIC(6,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS project_item_groups (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    sort_order        INTEGER NOT NULL DEFAULT 0,
    custom_sell_price NUMERIC(12,2),
    is_visible        BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE project_items
    ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES project_item_groups(id) ON DELETE SET NULL;
