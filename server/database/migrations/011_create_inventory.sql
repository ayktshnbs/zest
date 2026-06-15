-- Inventory / stock
-- ---------------------------------------------------------------------------
-- One row per sellable catalog product. `product_id` is the storefront catalog
-- id (lib/products.ts, e.g. "dor-m1") — TEXT, not a UUID FK, because products
-- live in the generated catalog rather than a products table.
--
-- This table is the SOURCE OF TRUTH for stock once seeded: order creation
-- decrements it transactionally (SELECT ... FOR UPDATE) so two concurrent
-- checkouts can never oversell. Seed it from the catalog with
-- `npm run seed:inventory` (idempotent — never clobbers live stock).

CREATE TABLE inventory (
  product_id  TEXT PRIMARY KEY,
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER inventory_set_updated_at
BEFORE UPDATE ON inventory
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
