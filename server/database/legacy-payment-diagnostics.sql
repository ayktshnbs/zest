-- ===========================================================================
-- Legacy payment / webhook data diagnostics  —  READ-ONLY
-- ===========================================================================
--
-- NOT a migration. This file lives OUTSIDE database/migrations/ on purpose:
-- migrate.js only reads migrations/*.sql, so nothing here ever runs
-- automatically. Run it by hand before/after deploying the N1+N2 changes.
--
--   psql "$DATABASE_URL" -f server/database/legacy-payment-diagnostics.sql
--
-- Background
-- ----------
-- The pre-`ZH{orderId}A{attempt}` implementation used a merchant_oid of
-- `PAYTR-{order.id}` — fixed per ORDER, not per attempt — and inserted a
-- payments row on every checkout call. Legacy orders can therefore hold
-- several rows sharing one provider_session_id.
--
-- The current settleAttempt (models/PaymentModel.js) never updates more than
-- one row: it resolves by provider_payment_id (UNIQUE) first, then by a single
-- candidate, then by a single still-`pending` candidate, and otherwise refuses
-- to guess — it returns "ambiguous", writes a
-- `payment.legacy_attempt_ambiguous` review event and answers PayTR with a
-- non-2xx so the callback is not falsely acknowledged.
--
-- Sections 1-4 tell you whether any such ambiguous rows exist. Section 5 is a
-- REVIEWABLE, NON-DESTRUCTIVE remediation you may apply per-order after
-- reconciling against PayTR. NOTHING here deletes payment data.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. Duplicate provider_session_id values (the N1 trigger condition)
--    Any row returned here is an order whose callbacks may hit the
--    "ambiguous" path. `pending_count` is the deciding factor: exactly 1
--    resolves automatically; 0 or >1 requires manual settlement.
-- ---------------------------------------------------------------------------
SELECT
  p.provider,
  p.provider_session_id,
  COUNT(*)                                                  AS row_count,
  COUNT(*) FILTER (WHERE p.status = 'pending')              AS pending_count,
  COUNT(*) FILTER (WHERE p.status = 'succeeded')            AS succeeded_count,
  COUNT(*) FILTER (WHERE p.status = 'failed')               AS failed_count,
  COUNT(p.provider_payment_id)                              AS with_payment_id,
  MIN(p.created_at)                                         AS first_seen,
  MAX(p.created_at)                                         AS last_seen,
  CASE
    WHEN COUNT(*) FILTER (WHERE p.status = 'pending') = 1 THEN 'auto-resolvable'
    ELSE 'MANUAL SETTLEMENT REQUIRED'
  END                                                       AS verdict
FROM payments p
WHERE p.provider_session_id IS NOT NULL
GROUP BY p.provider, p.provider_session_id
HAVING COUNT(*) > 1
ORDER BY row_count DESC, last_seen DESC;


-- ---------------------------------------------------------------------------
-- 2. Full row detail for every affected order — statuses, amounts,
--    provider_payment_id values, and the order's own state.
--    This is the evidence set to reconcile against PayTR's merchant panel.
-- ---------------------------------------------------------------------------
SELECT
  o.order_number,
  o.id                    AS order_id,
  o.status                AS order_status,
  o.total_cents           AS order_total_cents,
  o.stock_restored_at,
  u.email                 AS customer_email,
  p.id                    AS payment_id,
  p.provider_session_id,
  p.provider_payment_id,
  p.status                AS payment_status,
  p.amount_cents,
  p.failure_reason,
  p.created_at            AS payment_created_at,
  p.updated_at            AS payment_updated_at
FROM payments p
JOIN orders o ON o.id = p.order_id
JOIN users  u ON u.id = o.user_id
WHERE p.provider_session_id IN (
  SELECT provider_session_id
    FROM payments
   WHERE provider_session_id IS NOT NULL
   GROUP BY provider, provider_session_id
  HAVING COUNT(*) > 1
)
ORDER BY o.created_at DESC, p.created_at ASC;


-- ---------------------------------------------------------------------------
-- 3. Legacy-format merchant_oids still in the table.
--    `PAYTR-…` is the old per-order shape; `ZH…A{n}` is the current
--    per-attempt shape and is safe by construction.
-- ---------------------------------------------------------------------------
SELECT
  CASE
    WHEN provider_session_id LIKE 'PAYTR-%' THEN 'legacy (per-order oid)'
    WHEN provider_session_id ~ '^ZH[0-9a-fA-F]{32}A[0-9]+$' THEN 'current (per-attempt oid)'
    WHEN provider_session_id IS NULL THEN 'no session id'
    ELSE 'unrecognised'
  END                AS oid_format,
  COUNT(*)           AS rows,
  COUNT(DISTINCT provider_session_id) AS distinct_oids
FROM payments
GROUP BY 1
ORDER BY rows DESC;


-- ---------------------------------------------------------------------------
-- 4. webhook_events rows that were NEVER successfully processed (the N2
--    condition). Under the OLD code these were treated as "already claimed"
--    and could never be replayed. Under the CURRENT code
--    (claimForProcessing) they are replayable: any redelivery transitions
--    them to 'processed' and applies the effects.
--
--    SNAPSHOT THIS BEFORE DEPLOYING if you want the original payload/error
--    preserved verbatim — the replay folds the superseded values into
--    payload._replaced_payload / _replaced_status / _replaced_error, which is
--    lossless but nested.
--
--    Rows listed here whose payment was really taken but never recorded must
--    be reconciled by hand; PayTR will not re-send a callback from months ago.
-- ---------------------------------------------------------------------------
SELECT
  we.status,
  COUNT(*)          AS rows,
  MIN(received_at)  AS oldest,
  MAX(received_at)  AS newest
FROM webhook_events we
GROUP BY we.status
ORDER BY rows DESC;

SELECT
  we.id, we.provider, we.event_id, we.event_type, we.status,
  we.received_at, we.processed_at, we.error,
  we.payload->>'merchant_oid' AS merchant_oid,
  we.payload->>'status'       AS callback_status,
  we.payload->>'total_amount' AS callback_amount
FROM webhook_events we
WHERE we.status <> 'processed'
ORDER BY we.received_at DESC;


-- ===========================================================================
-- 5. REMEDIATION — review each statement before running. Nothing below is
--    destructive: no DELETE, no row is removed, amounts are never altered.
--    Apply only after reconciling the affected order against PayTR.
-- ===========================================================================
--
-- The ambiguity comes from several rows sharing one provider_session_id.
-- Detaching the rows that are NOT the live attempt removes the ambiguity while
-- keeping every row, every amount and every status exactly as they are — the
-- financial record is preserved in full.
--
-- Step 5a — inspect one order's rows first (substitute the oid):
--
--   SELECT id, status, amount_cents, provider_payment_id, created_at
--     FROM payments
--    WHERE provider_session_id = 'PAYTR-<order-uuid>'
--    ORDER BY created_at;
--
-- Step 5b — decide which single row represents the live/authoritative attempt
--   (normally the only `pending` one, or the one PayTR's panel shows as the
--   real transaction). Then archive the session id on the OTHERS so they can
--   no longer be matched by a callback. The original value is retained inside
--   raw_payload, so nothing is lost:
--
--   UPDATE payments
--      SET raw_payload = COALESCE(raw_payload, '{}'::jsonb)
--                        || jsonb_build_object(
--                             '_archived_provider_session_id', provider_session_id,
--                             '_archived_at', NOW(),
--                             '_archived_reason', 'legacy per-order merchant_oid de-duplication'
--                           ),
--          provider_session_id = NULL,
--          updated_at = NOW()
--    WHERE provider_session_id = 'PAYTR-<order-uuid>'
--      AND id <> '<the-one-authoritative-payment-id>';
--
--   After this the oid matches exactly one row and settleAttempt resolves it
--   deterministically. Re-run section 1 to confirm the group is gone.
--
-- Step 5c — if a legacy payment was genuinely taken but never recorded (from
--   section 4), record it explicitly rather than editing history. Give it a
--   provider_payment_id that cannot collide with a real callback:
--
--   -- INSERT INTO payments (order_id, provider, provider_session_id,
--   --                       provider_payment_id, status, amount_cents,
--   --                       currency, failure_reason, raw_payload)
--   -- VALUES ('<order-uuid>', 'paytr', NULL,
--   --         'manual_reconciliation_<paytr-reference>', 'succeeded', <kurus>,
--   --         'TRY', NULL,
--   --         jsonb_build_object('_manual', true, '_operator', '<you>',
--   --                            '_paytr_reference', '<ref>', '_at', NOW()));
--   -- then set the order status by hand via the admin panel.
--
-- ===========================================================================
