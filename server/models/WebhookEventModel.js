// Webhook idempotency log.
// The unique (provider, event_id) constraint is what makes processing
// safe to retry — duplicates collapse to ON CONFLICT DO NOTHING.

import { query } from "../database/pool.js";

/**
 * Try to record a webhook event. Returns the inserted row when the event
 * is brand new, or null if a row with the same (provider, event_id)
 * already existed — in which case the caller should NOT re-process.
 */
export const tryClaim = async ({ provider, eventId, eventType, payload }) => {
  const { rows } = await query(
    `INSERT INTO webhook_events (provider, event_id, event_type, payload)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (provider, event_id) DO NOTHING
     RETURNING *`,
    [provider, eventId, eventType, JSON.stringify(payload)],
  );
  return rows[0] ?? null;
};

export const markProcessed = async (id) => {
  await query(
    `UPDATE webhook_events
       SET status = 'processed', processed_at = NOW(), error = NULL
     WHERE id = $1`,
    [id],
  );
};

export const markFailed = async (id, error) => {
  await query(
    `UPDATE webhook_events
       SET status = 'failed', processed_at = NOW(), error = $2
     WHERE id = $1`,
    [id, String(error).slice(0, 2000)],
  );
};
