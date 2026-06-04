-- Orders
-- ---------------------------------------------------------------------------
-- Line items and shipping address are kept as JSONB snapshots so historical
-- orders survive product or pricing changes. A dedicated order_items table
-- would also work — this scaffold favours simplicity.

CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number      TEXT NOT NULL UNIQUE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'paid', 'fulfilled', 'cancelled', 'refunded')),
  currency          TEXT NOT NULL DEFAULT 'TRY',
  subtotal_cents    BIGINT NOT NULL CHECK (subtotal_cents >= 0),
  shipping_cents    BIGINT NOT NULL DEFAULT 0 CHECK (shipping_cents >= 0),
  tax_cents         BIGINT NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  total_cents       BIGINT NOT NULL CHECK (total_cents >= 0),
  items             JSONB NOT NULL,
  shipping_address  JSONB NOT NULL,
  billing_address   JSONB,
  notes             TEXT,
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX orders_user_idx ON orders (user_id, created_at DESC);
CREATE INDEX orders_status_idx ON orders (status);

CREATE TRIGGER orders_set_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
