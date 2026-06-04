-- Favorites / wishlist
-- ---------------------------------------------------------------------------
-- One row per (user, product). UNIQUE prevents duplicates so toggling is
-- idempotent on the client. product_id is plain text (the storefront's
-- catalog ID like "dor-m1") — no FK because the catalog lives in app
-- code, not the database.

CREATE TABLE favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX favorites_user_idx ON favorites (user_id, created_at DESC);
