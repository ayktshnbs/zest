// Payments. One row per payment ATTEMPT, created up-front by
// paymentController.createCheckout and later settled by the PayTR callback.
//
// provider_session_id holds the merchant_oid, which is unique per attempt
// (services/paymentService.js buildMerchantOid), so it is the natural key for
// settling the attempt that a callback belongs to. provider_payment_id is a
// UNIQUE column used as a second safety net against duplicate inserts.
//
// Lifecycle of one row:
//   created at checkout  → status 'pending'
//   callback arrives     → status 'succeeded' | 'failed'  (settleAttempt)
//   token request failed → status 'failed'                (markAttemptFailed)
//
// A row left at 'pending' inside the PayTR timeout window means an attempt is
// still LIVE — findLiveAttempt uses that to stop a second attempt being opened
// for the same order (which is how a customer could be charged twice).

import { query, pool } from "../database/pool.js";

/**
 * Open a new payment attempt. `db` accepts a transaction client so the row is
 * created in the same transaction that claims the attempt number — the
 * live-attempt guard is only reliable if the row is visible the moment the
 * transaction commits.
 */
export const create = async ({
  orderId,
  provider = "paytr",
  providerSessionId,
  amountCents,
  currency,
  rawPayload,
}, db = pool) => {
  const { rows } = await db.query(
    `INSERT INTO payments (
       order_id, provider, provider_session_id, amount_cents, currency, raw_payload
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [orderId, provider, providerSessionId ?? null, amountCents, currency, rawPayload ? JSON.stringify(rawPayload) : null],
  );
  return rows[0];
};

export const findByProviderPaymentId = async (providerPaymentId) => {
  const { rows } = await query(
    `SELECT * FROM payments WHERE provider_payment_id = $1 LIMIT 1`,
    [providerPaymentId],
  );
  return rows[0] ?? null;
};

export const findByProviderSessionId = async (providerSessionId, db = pool) => {
  const { rows } = await db.query(
    `SELECT * FROM payments WHERE provider_session_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [providerSessionId],
  );
  return rows[0] ?? null;
};

/**
 * An unresolved attempt that is still inside its PayTR validity window, or
 * null. `seconds_remaining` tells the caller how long until a new attempt may
 * be opened.
 *
 * Must be called on a transaction client that already holds the order row
 * lock, otherwise two concurrent checkouts could both see "no live attempt".
 */
export const findLiveAttempt = async (db, orderId, timeoutMinutes) => {
  const { rows } = await db.query(
    `SELECT id, provider_session_id, created_at,
            CEIL(EXTRACT(EPOCH FROM (
              created_at + ($2 || ' minutes')::interval - NOW()
            )))::int AS seconds_remaining
       FROM payments
      WHERE order_id = $1
        AND status = 'pending'
        AND created_at > NOW() - ($2 || ' minutes')::interval
      ORDER BY created_at DESC
      LIMIT 1`,
    [orderId, String(timeoutMinutes)],
  );
  return rows[0] ?? null;
};

/**
 * Apply a settlement to ONE payment row, addressed by primary key.
 *
 * Refuses a `succeeded → failed` regression.
 *
 * That transition is never legitimate: money has moved, and the `succeeded`
 * row is DURABLE evidence other subsystems read long after this transaction —
 * jobs/expirePendingOrders.js skips an order only while
 * `EXISTS (payments WHERE status='succeeded')`. On legacy per-order
 * merchant_oids one row is shared by every attempt, so letting a late failure
 * callback overwrite it would erase that evidence and let the expiry sweep
 * cancel the order and restock a purchase the customer had already paid for.
 *
 * A bare `UPDATE … RETURNING` cannot express this: it returns zero rows both
 * when the guard refuses AND when the id matches nothing at all, so a genuine
 * "payment row not found" would be indistinguishable from a successful
 * protection. The CTE below reports the two independently in ONE round trip:
 *
 *   target  — locks the row FOR UPDATE and tells us whether it exists
 *   updated — the guarded UPDATE, driven off `target`
 *
 * The final SELECT always returns exactly one row:
 *   target_found = 0            → no such payment row
 *   updated_row  IS NOT NULL    → settled
 *   updated_row  IS NULL        → guard refused; existing_row is what is there
 *
 * `updated_row` / `existing_row` are JSON projections of the payments row.
 * No caller currently reads their fields (both settle call sites discard the
 * return value), and amount_cents in kuruş is far inside JS integer range.
 *
 * @returns {{targetFound: boolean, updatedRow: object|null, existingRow: object|null}}
 */
const applySettlement = async (db, id, { providerPaymentId, status, amountCents, currency, failureReason, raw }) => {
  const { rows } = await db.query(
    `WITH target AS (
       SELECT * FROM payments WHERE id = $1 FOR UPDATE
     ),
     updated AS (
       UPDATE payments p
          SET status              = $2,
              provider_payment_id = $3,
              amount_cents        = $4,
              currency            = $5,
              failure_reason      = $6,
              raw_payload         = $7,
              updated_at          = NOW()
         FROM target t
        WHERE p.id = t.id
          AND NOT ($2::text = 'failed' AND t.status = 'succeeded')
        RETURNING p.*
     )
     SELECT (SELECT count(*) FROM target)::int  AS target_found,
            (SELECT to_jsonb(u) FROM updated u) AS updated_row,
            (SELECT to_jsonb(t) FROM target t)  AS existing_row`,
    [id, status, providerPaymentId, amountCents, currency, failureReason ?? null, raw],
  );
  const r = rows[0];
  return {
    targetFound: Boolean(r && r.target_found > 0),
    updatedRow: r?.updated_row ?? null,
    existingRow: r?.existing_row ?? null,
  };
};

/**
 * applySettlement + classification. Exactly three outcomes:
 *
 *   "settled"             — the row was updated; `row` is the new state
 *   "protected_succeeded" — the row is already `succeeded` and this is a
 *                           failure callback, so it was deliberately left
 *                           alone; `row` is what is actually there, so the
 *                           caller can log it
 *   "missing_row"         — the id matched nothing. A real fault: both call
 *                           sites pass an id they just SELECTed FOR UPDATE in
 *                           this transaction, so the row cannot legitimately
 *                           vanish. The caller must abort, not continue.
 */
const settleRow = async (db, id, patch) => {
  const { targetFound, updatedRow, existingRow } = await applySettlement(db, id, patch);
  if (!targetFound) return { outcome: "missing_row", row: null };
  if (updatedRow) return { outcome: "settled", row: updatedRow };
  return { outcome: "protected_succeeded", row: existingRow };
};

/**
 * Settle the attempt a callback belongs to — EXACTLY ONE payment row, never
 * more, never guessed.
 *
 * Why this is not a single `UPDATE … WHERE provider_session_id = $1`:
 * provider_session_id has only a NON-UNIQUE index (payments_session_idx). The
 * pre-`ZH…A{n}` implementation used a merchant_oid of `PAYTR-{order.id}` —
 * fixed per ORDER, not per attempt — and inserted a row on every checkout
 * call, so legacy orders can hold several rows sharing one session id. A
 * blanket UPDATE would have written the same provider_payment_id (TEXT UNIQUE)
 * onto all of them, raising 23505, aborting the webhook transaction and
 * looping PayTR on HTTP 500 forever.
 *
 * WHAT THE CALLBACK ACTUALLY TELLS US
 * -----------------------------------
 * A PayTR callback carries: merchant_oid, status, total_amount, hash,
 * payment_type, failed_reason_code/msg, currency, test_mode. NONE of these
 * identifies a payment ATTEMPT — only merchant_oid links a callback to a row.
 * `provider_payment_id` is NOT provider data either: we compute it ourselves
 * as `paytr_{merchant_oid}`, so it carries exactly the same information the
 * oid does and cannot disambiguate anything the oid cannot.
 *
 * Therefore the ONLY sound rule is: settle a row when merchant_oid maps to
 * exactly one row, and refuse otherwise.
 *
 *   candidates for (provider, provider_session_id):
 *     > 1  → AMBIGUOUS. No writes. Legacy oids were per-ORDER, so several
 *            attempts share one; the callback cannot say which it settled.
 *     = 1  → settle that row (unambiguous mapping), by primary key.
 *     = 0  → settle the row holding this oid's UNIQUE provider_payment_id if
 *            one exists, else INSERT a fresh settled row.
 *
 * There is deliberately NO "pick the only pending one" / "pick the newest" /
 * "pick the closest amount" fallback. Those are deterministic but not
 * CORRECT: with `A=failed, B=pending` sharing one legacy oid, a delayed
 * success callback belonging to A would be attributed to B and silently
 * settle the wrong attempt. Being reproducibly wrong is still wrong.
 *
 * Candidates are locked FOR UPDATE so two concurrent settlements of the same
 * merchant_oid serialise and the second sees the first's result.
 *
 * @returns {{outcome:"settled", row:object} | {outcome:"ambiguous", candidateIds:string[]}}
 */
export const settleAttempt = async ({
  orderId,
  provider = "paytr",
  providerSessionId,
  providerPaymentId,
  status,
  amountCents,
  currency,
  failureReason,
  rawPayload,
}, db = pool) => {
  const raw = rawPayload ? JSON.stringify(rawPayload) : null;
  const patch = { providerPaymentId, status, amountCents, currency, failureReason, raw };

  // Every row a callback bearing this merchant_oid could possibly refer to.
  // Locked so concurrent settlements of the same oid serialise.
  const { rows: candidates } = providerSessionId
    ? await db.query(
        `SELECT id, status FROM payments
          WHERE provider_session_id = $1 AND provider = $2
          FOR UPDATE`,
        [providerSessionId, provider],
      )
    : { rows: [] };

  // ── The only safe rule ──────────────────────────────────────────────
  // merchant_oid is the ONLY link between a callback and a payment row.
  // When it maps to more than one row the callback simply does not say
  // which attempt it settled, so we refuse — no heuristic, no guess.
  if (candidates.length > 1) {
    return { outcome: "ambiguous", candidateIds: candidates.map((c) => c.id) };
  }

  // Row already carrying the derived provider_payment_id (UNIQUE ⇒ ≤ 1).
  // This is a CONSISTENCY CHECK, not an attempt selector: the value is
  // `paytr_{merchant_oid}`, computed by us from the oid, so it carries no
  // information the oid does not already carry.
  const { rows: byPaymentId } = providerPaymentId
    ? await db.query(
        `SELECT id FROM payments WHERE provider_payment_id = $1 FOR UPDATE`,
        [providerPaymentId],
      )
    : { rows: [] };

  if (candidates.length === 1) {
    // The oid maps to exactly one row ⇒ unambiguous.
    if (byPaymentId[0] && byPaymentId[0].id !== candidates[0].id) {
      // Two rows disagree about which one this oid settled. Inconsistent
      // data — refuse rather than overwrite either.
      return {
        outcome: "ambiguous",
        candidateIds: [candidates[0].id, byPaymentId[0].id],
      };
    }
    return settleRow(db, candidates[0].id, patch);
  }

  // candidates.length === 0
  if (byPaymentId[0]) {
    // No row carries the oid any more (e.g. an operator archived it during
    // legacy de-duplication) but one still carries this oid's unique payment
    // id. provider_payment_id is UNIQUE, so that mapping is unambiguous.
    return settleRow(db, byPaymentId[0].id, patch);
  }

  // Nothing to settle — insert a fresh settled record.
  const { rows } = await db.query(
    `INSERT INTO payments (
       order_id, provider, provider_session_id, provider_payment_id,
       status, amount_cents, currency, failure_reason, raw_payload
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      orderId,
      provider,
      providerSessionId ?? null,
      providerPaymentId,
      status,
      amountCents,
      currency,
      failureReason ?? null,
      raw,
    ],
  );
  return { outcome: "settled", row: rows[0] };
};

/**
 * Fail an attempt whose PayTR session was never actually created (the token
 * request errored). Without this the 'pending' row would block retries for the
 * whole timeout window even though no payment page ever existed.
 *
 * Addressed by PRIMARY KEY, not by merchant_oid: `provider_session_id` has no
 * unique constraint, and a session-id predicate would be an unbounded UPDATE
 * against legacy rows that share the old per-order oid. The caller holds the
 * id of the row it just created, so there is no reason to search for it.
 * The `status = 'pending'` guard keeps this from clobbering an attempt a
 * callback settled in the meantime.
 */
export const markAttemptFailed = async (paymentId, reason) => {
  const { rows } = await query(
    `UPDATE payments
        SET status = 'failed', failure_reason = $2, updated_at = NOW()
      WHERE id = $1 AND status = 'pending'
      RETURNING *`,
    [paymentId, String(reason).slice(0, 500)],
  );
  return rows[0] ?? null;
};

/** True when this order has a settled (succeeded) payment on record. */
export const hasSucceeded = async (orderId, db = pool) => {
  const { rows } = await db.query(
    `SELECT 1 FROM payments WHERE order_id = $1 AND status = 'succeeded' LIMIT 1`,
    [orderId],
  );
  return rows.length > 0;
};

/** How many settled payments this order has. >1 means a probable double charge. */
export const countSucceeded = async (orderId, db = pool) => {
  const { rows } = await db.query(
    `SELECT COUNT(*)::int AS n FROM payments WHERE order_id = $1 AND status = 'succeeded'`,
    [orderId],
  );
  return rows[0]?.n ?? 0;
};

export const listForOrder = async (orderId) => {
  const { rows } = await query(
    `SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC`,
    [orderId],
  );
  return rows;
};
