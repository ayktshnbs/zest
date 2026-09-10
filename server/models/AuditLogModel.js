// Append-only audit log. Never updated, never deleted (rotate via a
// scheduled job if storage becomes an issue).

import { query, pool } from "../database/pool.js";

/**
 * `db` accepts a transaction client. Payment webhooks pass theirs so an audit
 * entry can never outlive a rolled-back payment transaction (an orphaned
 * "payment.succeeded" row for work that never committed is worse than no row).
 */
export const insert = async ({ userId, action, ip, userAgent, metadata }, db = pool) => {
  const { rows } = await db.query(
    `INSERT INTO audit_logs (user_id, action, ip_address, user_agent, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, created_at`,
    [
      userId ?? null,
      action,
      ip ?? null,
      userAgent ?? null,
      JSON.stringify(metadata ?? {}),
    ],
  );
  return rows[0];
};

/**
 * Payment events an operator has to look at by hand. Writers flag these with
 * `metadata.requiresManualReview = true` (amount mismatches, probable double
 * charges, failed webhook processing, orders needing a refund).
 *
 * Deliberately reuses audit_logs rather than adding a second notification
 * store: the events are already written there, they just had no reader.
 */
/** Action of the append-only row that marks a review handled. */
export const REVIEW_RESOLVED_ACTION = "payment.review_resolved";

/**
 * Payment reviews, newest first, each annotated with its resolution (if any).
 *
 * Resolution is itself an append-only audit row
 * (action = 'payment.review_resolved', metadata.resolvesAuditId = <review id>)
 * so the original incident row is never mutated or deleted — the evidence
 * stays exactly as the webhook wrote it.
 *
 * Returns `total` (every review ever) and `unresolvedTotal` (those with no
 * resolution row). The dashboard badge uses the latter, otherwise a single
 * historical incident would keep the alert lit forever.
 */
export const listPaymentReviews = async ({ limit = 50, offset = 0 } = {}) => {
  const { rows } = await query(
    `SELECT a.id, a.action, a.metadata, a.created_at,
            r.created_at            AS resolved_at,
            r.metadata->>'note'     AS resolution_note,
            ru.email                AS resolved_by_email,
            ru.name                 AS resolved_by_name
       FROM audit_logs a
       LEFT JOIN LATERAL (
            SELECT r.created_at, r.metadata, r.user_id
              FROM audit_logs r
             WHERE r.action = $3
               AND r.metadata->>'resolvesAuditId' = a.id::text
             ORDER BY r.created_at DESC
             LIMIT 1
       ) r ON TRUE
       LEFT JOIN users ru ON ru.id = r.user_id
      WHERE a.metadata->>'requiresManualReview' = 'true'
      ORDER BY a.created_at DESC
      LIMIT $1 OFFSET $2`,
    [limit, offset, REVIEW_RESOLVED_ACTION],
  );

  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (
              WHERE NOT EXISTS (
                SELECT 1 FROM audit_logs r
                 WHERE r.action = $1
                   AND r.metadata->>'resolvesAuditId' = a.id::text
              )
            )::int AS unresolved
       FROM audit_logs a
      WHERE a.metadata->>'requiresManualReview' = 'true'`,
    [REVIEW_RESOLVED_ACTION],
  );

  return {
    rows,
    total: countRows[0].total,
    unresolvedTotal: countRows[0].unresolved,
  };
};

/** One review row by id — used to validate a resolve request's target. */
export const findReviewById = async (id) => {
  const { rows } = await query(
    `SELECT id, action, metadata, created_at
       FROM audit_logs
      WHERE id = $1 AND metadata->>'requiresManualReview' = 'true'
      LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
};

/**
 * Serialise resolution of ONE review across concurrent requests.
 *
 * audit_logs is append-only, so there is no row to lock and no unique
 * constraint to lean on — two admins clicking "resolve" at the same moment
 * would both read "not resolved" and both insert. A transaction-scoped
 * advisory lock keyed on the review id makes the check-then-insert atomic
 * without a schema change; it is released automatically at COMMIT/ROLLBACK.
 *
 * The key is the first 64 bits of md5(reviewId) — a stable bigint per review.
 * A hash collision would only make two DIFFERENT reviews serialise with each
 * other, which is harmless.
 */
export const lockReviewForResolution = async (db, reviewId) => {
  await db.query(
    `SELECT pg_advisory_xact_lock(('x' || substr(md5($1), 1, 16))::bit(64)::bigint)`,
    [String(reviewId)],
  );
};

/** Is this review already resolved? Keeps resolve idempotent. */
export const findResolution = async (reviewId, db = pool) => {
  const { rows } = await db.query(
    `SELECT id, created_at, user_id FROM audit_logs
      WHERE action = $1 AND metadata->>'resolvesAuditId' = $2
      ORDER BY created_at DESC LIMIT 1`,
    [REVIEW_RESOLVED_ACTION, String(reviewId)],
  );
  return rows[0] ?? null;
};

export const listForUser = async (userId, { limit = 100, offset = 0 } = {}) => {
  const { rows } = await query(
    `SELECT id, action, ip_address, user_agent, metadata, created_at
       FROM audit_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
  return rows;
};
