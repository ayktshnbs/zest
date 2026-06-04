// Creem checkout integration.
//
// Creem (creem.io) follows the standard "create a hosted checkout session,
// redirect the customer, listen for webhooks" pattern. The exact endpoint
// path and webhook event shapes vary by gateway revision — keep them
// configurable via env so the integration can be retargeted without
// touching code.
//
// Endpoints used here:
//   POST {CREEM_API_BASE}/v1/checkouts
//
// Webhook signature: HMAC-SHA256 of the raw request body using
// CREEM_WEBHOOK_SECRET, sent in the `Creem-Signature` header
// (timestamp.signature, similar to Stripe). The check is in
// verifyWebhookSignature() — adjust to the live gateway if needed.

import crypto from "node:crypto";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import { AppError } from "../utils/errors.js";

const CREEM_HEADER = "creem-signature";
const SIGNATURE_TOLERANCE_SEC = 5 * 60; // accept signatures within ±5 minutes

/**
 * Create a hosted checkout session and return the URL the customer should
 * be redirected to.
 */
export const createCheckoutSession = async ({ order, user }) => {
  const body = {
    success_url: config.creem.successUrl,
    cancel_url: config.creem.cancelUrl,
    customer_email: user.email,
    metadata: {
      order_id: order.id,
      user_id: user.id,
    },
    line_items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit_amount: item.unitPriceCents,
      currency: order.currency,
    })),
    amount_total: Number(order.total_cents ?? order.totalCents),
    currency: order.currency,
    reference_id: order.order_number ?? order.orderNumber,
  };

  const res = await fetch(`${config.creem.apiBase}/v1/checkouts`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      authorization: `Bearer ${config.creem.apiKey}`,
      "idempotency-key": `order_${order.id}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    logger.error({ status: res.status, body: errText }, "Creem checkout creation failed");
    throw new AppError(
      "Could not create payment session",
      502,
      "payment_provider_error",
    );
  }

  const session = await res.json();
  return {
    sessionId: session.id,
    url: session.url ?? session.checkout_url,
    raw: session,
  };
};

/**
 * Constant-time signature verification for Creem webhooks.
 * The signature header is expected to look like `t=...,v1=...`
 * — adapt the parser if your gateway uses a different shape.
 *
 * Returns `true` only when:
 *   1. Header is present and parseable.
 *   2. Timestamp is within tolerance window.
 *   3. HMAC-SHA256(timestamp.body) matches the v1 value.
 */
export const verifyWebhookSignature = (rawBody, headers) => {
  const header = headers[CREEM_HEADER] || headers[CREEM_HEADER.toUpperCase()];
  if (!header || typeof header !== "string") return false;

  let timestamp = null;
  let v1 = null;
  for (const part of header.split(",")) {
    const [k, v] = part.split("=");
    if (!k || !v) continue;
    if (k.trim() === "t") timestamp = v.trim();
    if (k.trim() === "v1") v1 = v.trim();
  }
  if (!timestamp || !v1) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > SIGNATURE_TOLERANCE_SEC) return false;

  const payload = `${timestamp}.${rawBody.toString("utf8")}`;
  const expected = crypto
    .createHmac("sha256", config.creem.webhookSecret)
    .update(payload)
    .digest("hex");

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(v1, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};
