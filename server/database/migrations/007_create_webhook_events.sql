-- Webhook idempotency log
-- ---------------------------------------------------------------------------
-- Each provider webhook delivery is recorded by its provider-assigned event
-- ID. Insertion is conditional — if the row exists, we skip processing.

CREATE TABLE webhook_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider      TEXT NOT NULL,
  event_id      TEXT NOT NULL,
  event_type    TEXT NOT NULL,
  payload       JSONB NOT NULL,
  received_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at  TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'received'
                  CHECK (status IN ('received', 'processed', 'failed')),
  error         TEXT,
  UNIQUE (provider, event_id)
);

CREATE INDEX webhook_events_received_idx ON webhook_events (received_at DESC);
