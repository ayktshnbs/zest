// Webhook idempotency log.
//
// The unique (provider, event_id) constraint is what makes processing safe
// against duplicate deliveries.
//
// State machine
// -------------
//   (no row)              → never seen; process it
//   status = 'received'   → an OLD-implementation row: claimed but NOT proven
//                           processed (the process may have crashed mid-way)
//   status = 'failed'     → an OLD-implementation row: processing definitely
//                           did not complete
//   status = 'processed'  → effects committed; must never be applied again
//
// Only 'processed' means done. The previous version of this file treated ANY
// existing row as processed, which meant a legacy 'received'/'failed' row —
// representing an event whose payment effects were never applied — would be
// acknowledged with HTTP 200 and silently dropped. `claimForProcessing` fixes
// that: it inserts, or transitions an unprocessed row, and returns null ONLY
// when the row is already 'processed'.
//
// The claim is written by the caller INSIDE the transaction that applies the
// payment effects, so the two commit together:
//
//   "a committed row with status='processed'" ⟺ "the effects were applied"
//
// If processing rolls back, so does the claim (a legacy row reverts to its
// original 'received'/'failed' state), and the provider's retry replays it.

import { pool } from "../database/pool.js";

/**
 * Atomically claim a webhook event for processing and mark it processed.
 * MUST be called on the same transaction client that applies the effects.
 *
 * @returns {Promise<object|null>} the claimed row, or null when a COMMITTED
 *   row with status='processed' already exists — meaning another delivery
 *   already applied the effects and the caller must NOT re-apply them.
 *
 * Concurrency: `ON CONFLICT … DO UPDATE` takes a row lock on the conflicting
 * tuple. A second concurrent delivery blocks on that lock; when the first
 * transaction ends, the second re-evaluates the `WHERE status <> 'processed'`
 * guard against the *updated* row. If the first committed, the guard fails and
 * the second gets null (skip); if the first aborted, the row is back to its
 * unprocessed state and the second claims it. Exactly one delivery ever
 * applies the effects.
 *
 * Note this is strictly stronger than the previous DO NOTHING form, which
 * relied on speculative-insertion wait semantics rather than an explicit row
 * lock and re-check.
 */
export const claimForProcessing = async (
  { provider, eventId, eventType, payload },
  db = pool,
) => {
  const { rows } = await db.query(
    `INSERT INTO webhook_events (provider, event_id, event_type, payload, status, processed_at)
     VALUES ($1, $2, $3, $4, 'processed', NOW())
     ON CONFLICT (provider, event_id) DO UPDATE
        SET status       = 'processed',
            processed_at = NOW(),
            error        = NULL,
            event_type   = EXCLUDED.event_type,
            -- Keep the superseded delivery's evidence rather than discarding
            -- it: the row being transitioned was never successfully processed,
            -- but its payload/status/error are still useful forensics.
            payload      = EXCLUDED.payload || jsonb_build_object(
                             '_replaced_payload', webhook_events.payload,
                             '_replaced_status',  webhook_events.status,
                             '_replaced_error',   webhook_events.error
                           )
      WHERE webhook_events.status <> 'processed'
     RETURNING *`,
    [provider, eventId, eventType, JSON.stringify(payload)],
  );
  return rows[0] ?? null;
};

/**
 * Fetch one event by its id. Used by the legacy-identity gate: rows written
 * before the callback fingerprint existed use the bare `paytr-{merchant_oid}`
 * id, and their stored payload is what lets us tell a true redelivery from a
 * semantically different callback that happens to share that old id.
 */
export const findByEventId = async (provider, eventId, db = pool) => {
  const { rows } = await db.query(
    `SELECT id, event_id, event_type, status, payload, processed_at
       FROM webhook_events
      WHERE provider = $1 AND event_id = $2
      LIMIT 1`,
    [provider, eventId],
  );
  return rows[0] ?? null;
};

/** Has this event been fully processed? Read-only probe. */
export const isProcessed = async (provider, eventId, db = pool) => {
  const { rows } = await db.query(
    `SELECT 1 FROM webhook_events
      WHERE provider = $1 AND event_id = $2 AND status = 'processed'
      LIMIT 1`,
    [provider, eventId],
  );
  return rows.length > 0;
};
