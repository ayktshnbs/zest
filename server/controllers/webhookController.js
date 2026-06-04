// Creem webhook handler.
//
// Critical contract:
//   1. Request body arrives as a raw Buffer (configured in app.js).
//   2. Verify HMAC signature BEFORE parsing JSON.
//   3. Claim the event ID in webhook_events. If we've seen it, ack and stop.
//   4. Dispatch by event type.
//
// Always return 2xx after we've safely persisted the event — even on
// processing errors. Otherwise the provider retries and we lose
// idempotency. Processing failures are flagged in the webhook_events row.

import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyWebhookSignature } from "../services/paymentService.js";
import * as WebhookEventModel from "../models/WebhookEventModel.js";
import * as PaymentModel from "../models/PaymentModel.js";
import * as OrderModel from "../models/OrderModel.js";
import { recordAuditEvent } from "../services/auditService.js";
import { logger } from "../utils/logger.js";

export const creemWebhook = asyncHandler(async (req, res) => {
  // 1. Signature check
  const ok = verifyWebhookSignature(req.body, req.headers);
  if (!ok) {
    logger.warn({ ip: req.ip }, "Rejected webhook with bad signature");
    return res.status(400).json({ error: { code: "bad_signature" } });
  }

  // 2. Parse JSON (only after signature is verified)
  let event;
  try {
    event = JSON.parse(req.body.toString("utf8"));
  } catch {
    return res.status(400).json({ error: { code: "invalid_json" } });
  }

  const eventId = event.id || event.event_id;
  const eventType = event.type || event.event_type;
  if (!eventId || !eventType) {
    return res.status(400).json({ error: { code: "missing_event_fields" } });
  }

  // 3. Idempotent claim — if this returns null, we've already processed.
  const claim = await WebhookEventModel.tryClaim({
    provider: "creem",
    eventId,
    eventType,
    payload: event,
  });
  if (!claim) {
    return res.json({ ok: true, duplicate: true });
  }

  // 4. Dispatch
  try {
    switch (eventType) {
      case "checkout.completed":
      case "checkout.session.completed":
      case "payment.succeeded":
        await handlePaymentSucceeded(event);
        break;

      case "checkout.failed":
      case "payment.failed":
        await handlePaymentFailed(event);
        break;

      case "payment.refunded":
        await handlePaymentRefunded(event);
        break;

      default:
        logger.info({ eventType, eventId }, "Unhandled webhook event type");
    }

    await WebhookEventModel.markProcessed(claim.id);
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err, eventType, eventId }, "Webhook processing failed");
    await WebhookEventModel.markFailed(claim.id, err.message ?? String(err));
    // Still 2xx — we own the event now. The DB row is flagged for triage.
    res.json({ ok: true, processed: false });
  }
});

// ── Handlers ────────────────────────────────────────────────────────
const extractOrderId = (event) =>
  event?.data?.metadata?.order_id ||
  event?.metadata?.order_id ||
  event?.data?.object?.metadata?.order_id ||
  null;

const handlePaymentSucceeded = async (event) => {
  const orderId = extractOrderId(event);
  if (!orderId) throw new Error("No order_id in webhook payload");

  const order = await OrderModel.findById(orderId);
  if (!order) throw new Error(`Unknown order ${orderId}`);

  const data = event.data?.object || event.data || event;

  await PaymentModel.upsertFromWebhook({
    orderId: order.id,
    providerSessionId: data.session_id || data.checkout_id || data.id,
    providerPaymentId: data.payment_id || data.id,
    status: "succeeded",
    amountCents: Number(data.amount_total ?? data.amount ?? order.total_cents),
    currency: data.currency || order.currency,
    rawPayload: event,
  });

  if (order.status === "pending") {
    await OrderModel.updateStatus(order.id, "paid");
  }

  await recordAuditEvent({
    userId: order.user_id,
    action: "payment.succeeded",
    metadata: { orderId, eventId: event.id },
  });
};

const handlePaymentFailed = async (event) => {
  const orderId = extractOrderId(event);
  const data = event.data?.object || event.data || event;
  if (!orderId) return; // Best-effort — fail silently if we can't correlate

  await PaymentModel.upsertFromWebhook({
    orderId,
    providerSessionId: data.session_id || data.checkout_id || data.id,
    providerPaymentId: data.payment_id || data.id || `failed_${event.id}`,
    status: "failed",
    amountCents: Number(data.amount_total ?? data.amount ?? 0),
    currency: data.currency || "TRY",
    failureReason: data.failure_reason || data.error?.message,
    rawPayload: event,
  });

  await recordAuditEvent({
    action: "payment.failed",
    metadata: { orderId, eventId: event.id, reason: data.failure_reason },
  });
};

const handlePaymentRefunded = async (event) => {
  const orderId = extractOrderId(event);
  const data = event.data?.object || event.data || event;
  if (!orderId) return;

  await PaymentModel.upsertFromWebhook({
    orderId,
    providerSessionId: data.session_id,
    providerPaymentId: data.payment_id || data.id,
    status: "refunded",
    amountCents: Number(data.amount_refunded ?? data.amount ?? 0),
    currency: data.currency || "TRY",
    rawPayload: event,
  });

  await OrderModel.updateStatus(orderId, "refunded");

  await recordAuditEvent({
    action: "payment.refunded",
    metadata: { orderId, eventId: event.id },
  });
};
