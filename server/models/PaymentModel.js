// Payments. provider_payment_id is a unique key — UPSERT on it so duplicate
// webhooks don't create duplicate rows.

import { query } from "../database/pool.js";

export const create = async ({
  orderId,
  provider = "creem",
  providerSessionId,
  amountCents,
  currency,
  rawPayload,
}) => {
  const { rows } = await query(
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

export const findByProviderSessionId = async (providerSessionId) => {
  const { rows } = await query(
    `SELECT * FROM payments WHERE provider_session_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [providerSessionId],
  );
  return rows[0] ?? null;
};

/**
 * Mark a payment as succeeded / failed. UPSERT on provider_payment_id so a
 * webhook arriving before our local row exists still settles correctly.
 */
export const upsertFromWebhook = async ({
  orderId,
  provider = "creem",
  providerSessionId,
  providerPaymentId,
  status,
  amountCents,
  currency,
  failureReason,
  rawPayload,
}) => {
  const { rows } = await query(
    `INSERT INTO payments (
       order_id, provider, provider_session_id, provider_payment_id,
       status, amount_cents, currency, failure_reason, raw_payload
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (provider_payment_id) DO UPDATE
       SET status = EXCLUDED.status,
           failure_reason = EXCLUDED.failure_reason,
           raw_payload = EXCLUDED.raw_payload,
           updated_at = NOW()
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
      rawPayload ? JSON.stringify(rawPayload) : null,
    ],
  );
  return rows[0];
};

export const listForOrder = async (orderId) => {
  const { rows } = await query(
    `SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC`,
    [orderId],
  );
  return rows;
};
