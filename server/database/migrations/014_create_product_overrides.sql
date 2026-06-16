-- Product overrides
-- ---------------------------------------------------------------------------
-- Admin-editable name/price for the existing catalog products. Products still
-- live in the storefront code (lib/products.ts → catalog.json); this table only
-- carries the fields an admin can change at runtime. A NULL column means "use
-- the code default". `product_id` is the catalog id (TEXT, no FK). Stock lives
-- separately in `inventory`. (Adding brand-new products = a later phase.)

CREATE TABLE product_overrides (
  product_id   TEXT PRIMARY KEY,
  name         TEXT,
  price_cents  BIGINT CHECK (price_cents IS NULL OR price_cents >= 0),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER product_overrides_set_updated_at
BEFORE UPDATE ON product_overrides
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
