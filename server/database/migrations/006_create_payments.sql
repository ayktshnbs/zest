-- Payments
-- ---------------------------------------------------------------------------
-- One row per attempted payment. Multiple payments per order are possible
-- (retries, refunds). provider_payment_id is unique so duplicate webhooks
-- collapse to a single row.

CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  provider            TEXT NOT NULL DEFAULT 'creem',
  provider_session_id TEXT,
  provider_payment_id TEXT UNIQUE,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  amount_cents        BIGINT NOT NULL CHECK (amount_cents >= 0),
  currency            TEXT NOT NULL,
  failure_reason      TEXT,
  raw_payload         JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX payments_order_idx ON payments (order_id, created_at DESC);
CREATE INDEX payments_status_idx ON payments (status);
CREATE INDEX payments_session_idx ON payments (provider_session_id);

CREATE TRIGGER payments_set_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
