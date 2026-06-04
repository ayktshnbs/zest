-- Users
-- ---------------------------------------------------------------------------
-- Email is CITEXT so 'aykut@x.com' == 'Aykut@X.COM' at the database level —
-- no need to lowercase before queries, and no risk of duplicate signups
-- differing only in case.
--
-- password_hash is nullable so OAuth-only accounts (Google sign-in) can
-- exist without a local password.

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           CITEXT NOT NULL UNIQUE,
  password_hash   TEXT,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'customer'
                    CHECK (role IN ('customer', 'admin')),
  google_sub      TEXT UNIQUE,
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX users_created_at_idx ON users (created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
