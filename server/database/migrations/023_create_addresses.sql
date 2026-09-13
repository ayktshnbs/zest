-- Saved delivery addresses ("Adreslerim").
-- ---------------------------------------------------------------------------
-- Deliberately NOT referenced by orders. orders.shipping_address (migration
-- 005) already stores a JSONB snapshot taken at checkout time — that snapshot
-- is the sole source of truth for what was shipped where, and it has no FK to
-- this table. Editing or deleting a saved address here can therefore never
-- alter a past order: there is no reference for it to alter.
--
-- Field shapes mirror the existing order shipping-address schema
-- (utils/validation.js: fullName, phone, line1, line2, city, state,
-- postalCode, country) plus two address-book-only concepts: `title` (the
-- user's own label, e.g. "Ev", "İş") and `is_default`.

CREATE TABLE addresses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  full_name    TEXT NOT NULL,
  phone        TEXT,
  line1        TEXT NOT NULL,
  line2        TEXT,
  city         TEXT NOT NULL,
  state        TEXT,
  postal_code  TEXT NOT NULL,
  country      TEXT NOT NULL DEFAULT 'TR',
  is_default   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX addresses_user_idx ON addresses (user_id, created_at DESC);

-- Enforced by the database, not just application logic: at most one row per
-- user can have is_default = TRUE. A partial unique index only constrains the
-- rows where the predicate holds, so any number of non-default rows coexist
-- freely.
CREATE UNIQUE INDEX addresses_one_default_per_user
  ON addresses (user_id)
  WHERE is_default;

-- Reuses the trigger function already defined in 002_create_users.sql.
CREATE TRIGGER addresses_set_updated_at
BEFORE UPDATE ON addresses
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
