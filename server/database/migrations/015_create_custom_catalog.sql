-- Admin-managed categories + custom products
-- ---------------------------------------------------------------------------
-- Phase 2 of the product editor: admins can now ADD brand-new products and
-- their own categories from the panel. The original 46 catalog products still
-- live in lib/products.ts (the storefront merges both on read); these tables
-- carry everything an admin creates at runtime.
--
-- Each category gets a slug (used in URLs); products belong to either a
-- built-in category slug (e.g. 'mutfak') OR a custom one. ON DELETE RESTRICT so
-- a category with products can't be removed by mistake — the admin must move
-- or delete its products first.

CREATE TABLE categories (
  slug          TEXT PRIMARY KEY,
  label         TEXT NOT NULL,
  image_url     TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER categories_set_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Brand-new products added from the admin panel. The id is generated as a slug
-- (e.g. "custom-...") so it never collides with the built-in catalog ids.
CREATE TABLE custom_products (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  category_slug   TEXT NOT NULL,
  price_cents     BIGINT NOT NULL CHECK (price_cents >= 0),
  short_description TEXT,
  description     TEXT,
  image_urls      TEXT[] NOT NULL DEFAULT '{}',
  badges          JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX custom_products_category_idx ON custom_products (category_slug);
CREATE INDEX custom_products_active_idx ON custom_products (is_active);

CREATE TRIGGER custom_products_set_updated_at
BEFORE UPDATE ON custom_products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
