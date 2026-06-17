-- Color variants for custom products
-- ---------------------------------------------------------------------------
-- Storage containers (Saklama Kapları) are being restructured into "sets" with
-- color choices. Each (set product, color) combination has its own stock + its
-- own image gallery. Existing 12 built-in storage products are retired via a
-- new is_active flag on product_overrides (so historical orders stay valid).

-- Add volume + set_size + retire-flag to custom_products so a set product can
-- carry "600ml" / "3'lü" structurally (filters, display) instead of cramming
-- it all into the product name.
ALTER TABLE custom_products
  ADD COLUMN volume_label TEXT,                -- e.g. "600ml", "1L", "1.8L"
  ADD COLUMN set_size     INTEGER              -- 3, 6, 12 (NULL = not a set)
    CHECK (set_size IS NULL OR set_size > 0);

CREATE INDEX custom_products_set_idx ON custom_products (volume_label, set_size);

-- Per-color variant rows. One row per (product, color). The variant's stock is
-- the source of truth — when the product has variants, custom_products.image_urls
-- + inventory.stock are ignored for that product.
CREATE TABLE product_variants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    TEXT NOT NULL REFERENCES custom_products(id) ON DELETE CASCADE,
  color_key     TEXT NOT NULL,                  -- url-safe slug: "bej", "siyah"
  color_label   TEXT NOT NULL,                  -- shown to customers: "Bej"
  color_hex     TEXT NOT NULL,                  -- swatch background: "#D6C7A7"
  stock         INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_urls    TEXT[] NOT NULL DEFAULT '{}',
  position      INTEGER NOT NULL DEFAULT 0,     -- display order
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, color_key)
);

CREATE INDEX product_variants_product_idx ON product_variants (product_id);

CREATE TRIGGER product_variants_set_updated_at
BEFORE UPDATE ON product_variants
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Allow admins to retire built-in catalog products without deleting code. When
-- false the storefront hides the product entirely. New `is_active` defaults to
-- TRUE so existing overrides keep working.
ALTER TABLE product_overrides
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
