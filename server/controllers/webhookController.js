// PayTR callback (bildirim) handler.
//
// Money-safety contract
// ---------------------
//  1. PayTR POSTs application/x-www-form-urlencoded data.
//  2. Verify the HMAC hash BEFORE anything else. A bad hash gets 400 and is
//     never recorded.
//  3. The idempotency claim and the payment effects share ONE transaction.
//     A committed webhook_events row therefore means "fully processed", and
//     nothing else. If processing fails the claim rolls back with it, so the
//     provider's retry replays the event cleanly.
//  4. Respond "OK" (200) only after that transaction has committed. If it did
//     not, respond 500 so PayTR retries — never swallow a payment we failed to
//     record.
//
// Why not the old design: the claim used to be committed on its own connection
// BEFORE processing. A transient DB error then rolled back the payment work but
// left the claim behind, so the same successful callback could never be
// processed again. The order stayed `pending`, the expiry sweep later cancelled
// it and returned the stock, and the customer had still been charged.
//
// Other money rules encoded below:
//   * failed  → return the reserved stock, exactly once (stockService).
//   * success with a MISMATCHED amount → never mark the order paid, but do
//     record the payment as succeeded so the expiry sweep won't cancel and
//     restock goods the customer may have been charged for. Flagged for review.
//   * success for an already-cancelled order (callback lost the race with the
//     expiry sweep) → try to re-reserve the stock and honour the order;
//     if stock is gone, leave it cancelled and flag it for a manual refund.
//   * a SECOND settled payment on one order → flagged as a probable double
//     charge, never recorded as a routine success.

import crypto from "node:crypto";
import { pool } from "../database/pool.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyPaytrHash } from "../services/paymentService.js";
import { restoreOrderStock, reserveOrderStock } from "../services/stockService.js";
import * as WebhookEventModel from "../models/WebhookEventModel.js";
import * as PaymentModel from "../models/PaymentModel.js";
import * as OrderModel from "../models/OrderModel.js";
import { recordAuditEvent } from "../services/auditService.js";
import { logger } from "../utils/logger.js";

/**
 * Resolve the order behind a merchant_oid.
 *
 * The payments row written at checkout is the authoritative mapping — it is
 * keyed on the exact merchant_oid we sent, so it works for every oid format we
 * have ever used. The string parse is a fallback for the legacy `PAYTR-{uuid}`
 * shape and the current `ZH{uuidhex}A{n}` shape, in case the callback beats
 * our own INSERT.
 */
const resolveOrderId = async (merchantOid, db) => {
  if (!merchantOid) return null;
  const payment = await PaymentModel.findByProviderSessionId(String(merchantOid), db);
  if (payment?.order_id) return payment.order_id;

  const str = String(merchantOid);
  if (str.startsWith("PAYTR-")) return str.slice(6);
  // ZH + 32 hex chars + A + attempt  →  rebuild the dashed UUID
  const match = /^ZH([0-9a-fA-F]{32})A\d+$/.exec(str);
  if (match) {
    const h = match[1];
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
  return null;
};

/** Sentinel: another delivery already processed this event; abort quietly. */
const ALREADY_PROCESSED = Symbol("already_processed");

/**
 * Raised when legacy payment rows make it impossible to tell WHICH attempt a
 * callback settles (several rows share the pre-`ZH…A{n}` per-order
 * merchant_oid and none or more than one is still pending). We refuse to guess:
 * nothing is written, the transaction aborts, the event stays replayable, and
 * the condition is surfaced for an operator.
 */
class AmbiguousLegacyAttemptError extends Error {
  constructor(candidateIds) {
    super(
      `Cannot determine which legacy payment attempt this callback settles (${candidateIds.length} candidates)`,
    );
    this.name = "AmbiguousLegacyAttemptError";
    this.candidateIds = candidateIds;
    this.reviewAction = "payment.legacy_attempt_ambiguous";
    this.reviewMetadata = { candidatePaymentIds: candidateIds };
    this.reviewDetail =
      "Several legacy payment rows share this merchant_oid, and the callback carries no field identifying which attempt it settled. NOTHING was written. Settle this payment by hand against PayTR's records, then de-duplicate the rows (see server/database/legacy-payment-diagnostics.sql).";
  }
}

/**
 * Raised when a pre-fingerprint `webhook_events` row is already `processed`
 * under the old per-order event id but its stored payload cannot be compared
 * with this callback (missing status / total_amount). We can neither prove
 * this is a redelivery (→ would wrongly discard money movement) nor prove it
 * is new (→ would wrongly re-apply it), so we refuse and ask for a human.
 */
class LegacyEventIdentityError extends Error {
  constructor(legacyEventId) {
    super(`Cannot compare callback against legacy webhook event ${legacyEventId}`);
    this.name = "LegacyEventIdentityError";
    this.reviewAction = "payment.legacy_event_identity_unclear";
    this.reviewMetadata = { legacyEventId };
    this.reviewDetail =
      "A webhook_events row recorded under the old per-order event id is already marked processed, but its stored payload lacks the fields needed to tell whether this callback is a redelivery of it or a genuinely different one. NOTHING was written. Compare against PayTR's records by hand.";
  }
}

/**
 * Unwrap settleAttempt's result, converting ambiguity into a thrown abort.
 *
 * Outcomes:
 *   "settled"              → row updated/inserted
 *   "ambiguous"            → refuse and abort (legacy oid maps to many rows)
 *   "protected_succeeded"  → NOT an error: a failure callback tried to regress
 *                            an already-settled row and was refused. The
 *                            caller's `hadSucceededPayment` branch records it
 *                            as a conflicting callback.
 *   "missing_row"          → abort. The id came from a SELECT … FOR UPDATE in
 *                            this very transaction, so a vanished row is a
 *                            real fault, not a protection. Throwing routes it
 *                            to the H1 retry path (ROLLBACK → 500 RETRY),
 *                            never a silent 200.
 */
const requireSettled = (result) => {
  if (result.outcome === "ambiguous") {
    throw new AmbiguousLegacyAttemptError(result.candidateIds);
  }
  if (result.outcome === "missing_row") {
    throw new Error("Payment row disappeared during settlement");
  }
  return result.row;
};

export const paytrCallback = asyncHandler(async (req, res) => {
  // 1. Read form-urlencoded body fields
  const {
    merchant_oid: merchantOid,
    status,
    total_amount: totalAmount,
    hash,
    payment_type: paymentType,
    failed_reason_code: failedReasonCode,
    failed_reason_msg: failedReasonMsg,
    currency,
    test_mode: testMode,
  } = req.body;

  // 2. Hash verification — reject immediately if invalid.
  const hashValid = verifyPaytrHash({ merchantOid, status, totalAmount, hash });

  if (!hashValid) {
    logger.warn(
      { merchantOid, ip: req.ip },
      "PayTR callback rejected: invalid hash",
    );
    // A non-OK response tells PayTR we did not accept it — security boundary.
    return res.status(400).type("text/plain").send("HASH_MISMATCH");
  }

  // ── Event identity ───────────────────────────────────────────────────
  // The id must collapse exact redeliveries while keeping SEMANTICALLY
  // different callbacks apart. `paytr-{merchant_oid}` alone could not: legacy
  // oids are per-ORDER, so a failure and a later genuine success for the same
  // order shared one id and the success was discarded as a duplicate.
  //
  // The fingerprint adds PayTR's own `hash` — HMAC-SHA256 over
  // (merchant_oid + merchant_salt + status + total_amount) keyed by
  // merchant_key. It is deterministic for a given callback, identical on every
  // redelivery, and different the moment status or amount differ. It is used
  // only AFTER verifyPaytrHash has proved it, so an attacker cannot steer the
  // identity without the merchant key: a forged hash is rejected at step 2 and
  // never reaches this line. status/total_amount are folded in as well so a
  // hypothetical hash collision still cannot merge two different callbacks.
  // No randomness, no timestamps — the id is a pure function of the callback.
  const callbackFingerprint = crypto
    .createHash("sha256")
    .update([merchantOid, status, String(totalAmount), String(hash)].join("|"))
    .digest("hex");
  const eventId = `paytr-${merchantOid}:${callbackFingerprint}`;
  // Identity used before the fingerprint existed. Still consulted so a
  // deploy cannot replay callbacks that were already applied under it.
  const legacyEventId = `paytr-${merchantOid}`;
  const eventType = status === "success" ? "payment.succeeded" : "payment.failed";

  // 3 + 4. Claim and apply, atomically.
  //   outcome "ok"        → committed; acknowledge
  //   outcome "duplicate" → another delivery already committed it; acknowledge
  //   outcome "retry"     → nothing committed; ask PayTR to send it again
  const client = await pool.connect();
  let outcome = "ok";
  let failure = null;
  try {
    await client.query("BEGIN");

    // ── Legacy-identity gate ───────────────────────────────────────────
    // Rows written before the fingerprint existed live under the bare
    // per-order id. If one is already `processed` we must decide whether this
    // callback IS that one (redelivery → acknowledge, apply nothing) or a
    // different one that merely shared the old id (→ must be processed under
    // its own fingerprint). The stored payload's status + total_amount are
    // exactly the fields PayTR's verified hash covers, so the comparison is
    // decisive. Anything we cannot compare fails safe, never silently.
    const legacyEvent = await WebhookEventModel.findByEventId(
      "paytr",
      legacyEventId,
      client,
    );
    if (legacyEvent && legacyEvent.status === "processed") {
      const p = legacyEvent.payload ?? {};
      const comparable = p.status != null && p.total_amount != null;
      if (!comparable) throw new LegacyEventIdentityError(legacyEventId);
      const sameCallback =
        String(p.status) === String(status) &&
        String(p.total_amount) === String(totalAmount);
      if (sameCallback) throw ALREADY_PROCESSED;
      // Different callback under a shared legacy id — fall through and process
      // it under its own fingerprint id.
      logger.warn(
        { merchantOid, legacyEventId, previous: p.status, current: status },
        "Legacy per-order event id shared by two different callbacks — processing the new one under its fingerprint",
      );
    }

    // Claim FIRST, on this transaction's client. Returns null ONLY when a
    // committed row with status='processed' already exists (a genuine
    // duplicate). A legacy row left at 'received'/'failed' by the old
    // implementation is NOT processed, so it is claimed and replayed here.
    // A concurrent delivery blocks on the conflicting row's lock, then
    // re-checks — so exactly one delivery ever applies the effects.
    const claim = await WebhookEventModel.claimForProcessing(
      {
        provider: "paytr",
        eventId,
        eventType,
        payload: {
          merchant_oid: merchantOid,
          status,
          total_amount: totalAmount,
          payment_type: paymentType,
          failed_reason_code: failedReasonCode,
          failed_reason_msg: failedReasonMsg,
          currency,
          test_mode: testMode,
        },
      },
      client,
    );
    if (!claim) throw ALREADY_PROCESSED;

    const orderId = await resolveOrderId(merchantOid, client);
    if (!orderId) throw new Error(`Cannot resolve order from ${merchantOid}`);

    // Lock the order row for the rest of the transaction. This also serialises
    // against createCheckout and the expiry sweep, which take the same lock.
    const order = await OrderModel.lockForUpdate(client, orderId);
    if (!order) throw new Error(`Unknown order ${orderId}`);

    const expectedAmount = Number(order.total_cents);
    const receivedAmount = Number(totalAmount);
    const amountMatches = expectedAmount === receivedAmount;

    if (status === "success") {
      requireSettled(await PaymentModel.settleAttempt({
        orderId: order.id,
        provider: "paytr",
        providerSessionId: merchantOid,
        providerPaymentId: `paytr_${merchantOid}`,
        status: "succeeded",
        amountCents: receivedAmount,
        currency: currency || order.currency,
        // A mismatch still counts as money moved — recording it as succeeded
        // is what stops the expiry sweep from restocking a charged order.
        failureReason: amountMatches
          ? null
          : `AMOUNT MISMATCH — expected ${expectedAmount}, received ${receivedAmount}. Order held for manual review.`,
        rawPayload: req.body,
      }, client));

      // Probable double charge: more than one settled payment on this order.
      // Checked for EVERY success, whatever the order status, so a second
      // charge can never be filed away as a routine success.
      const settledCount = await PaymentModel.countSucceeded(order.id, client);
      if (settledCount > 1) {
        logger.error(
          { orderId: order.id, merchantOid, settledCount },
          "MULTIPLE SETTLED PAYMENTS on one order — probable double charge",
        );
        await recordAuditEvent({
          userId: order.user_id,
          action: "payment.double_charge_detected",
          metadata: {
            orderId: order.id,
            orderNumber: order.order_number,
            merchantOid,
            settledPaymentCount: settledCount,
            requiresManualReview: true,
            detail: `Order has ${settledCount} settled payments. Verify with PayTR and refund the extra charge.`,
          },
        }, client);
      }

      if (!amountMatches) {
        // Never auto-complete an order we can't reconcile. Leave the status
        // untouched and flag it — the sweep skips orders with a succeeded
        // payment, so nothing will silently cancel or restock it.
        logger.error(
          { merchantOid, orderId: order.id, expected: expectedAmount, received: receivedAmount },
          "PayTR callback AMOUNT MISMATCH — order held for manual review",
        );
        await recordAuditEvent({
          userId: order.user_id,
          action: "payment.amount_mismatch",
          metadata: {
            orderId: order.id,
            orderNumber: order.order_number,
            merchantOid,
            expected: expectedAmount,
            received: receivedAmount,
            requiresManualReview: true,
            detail: `Charged ${receivedAmount} but order total is ${expectedAmount}. Order left pending.`,
          },
        }, client);
      } else if (order.status === "pending") {
        await OrderModel.updateStatus(order.id, "paid", client);
        await recordAuditEvent({
          userId: order.user_id,
          action: "payment.succeeded",
          metadata: { orderId: order.id, merchantOid, paymentType },
        }, client);
      } else if (order.status === "cancelled" || order.status === "failed") {
        // The callback lost a race with the expiry sweep (or with a failure
        // callback from an earlier attempt). The customer HAS been charged, so
        // try to honour the order by taking the stock back.
        const reservation = await reserveOrderStock(client, order.id);
        if (reservation.ok) {
          await OrderModel.updateStatus(order.id, "paid", client);
          logger.warn(
            { orderId: order.id, merchantOid, previousStatus: order.status },
            "Late PayTR success — order re-opened and stock re-reserved",
          );
          await recordAuditEvent({
            userId: order.user_id,
            action: "payment.succeeded_after_release",
            metadata: { orderId: order.id, merchantOid, previousStatus: order.status },
          }, client);
        } else {
          // Stock is gone — do not oversell. Flag for a manual refund.
          logger.error(
            { orderId: order.id, merchantOid, shortfall: reservation.items },
            "Late PayTR success but stock unavailable — MANUAL REFUND REQUIRED",
          );
          await recordAuditEvent({
            userId: order.user_id,
            action: "payment.requires_manual_refund",
            metadata: {
              orderId: order.id,
              orderNumber: order.order_number,
              merchantOid,
              previousStatus: order.status,
              shortfall: reservation.items,
              requiresManualReview: true,
              detail: "Customer was charged but the stock had already been sold. Refund required.",
            },
          }, client);
        }
      } else {
        // Order already paid/refunded — never regress a later status. If this
        // is a second charge the double-charge check above has already flagged
        // it; record the no-op for the trail.
        await recordAuditEvent({
          userId: order.user_id,
          action: "payment.succeeded_noop",
          metadata: { orderId: order.id, merchantOid, paymentType, orderStatus: order.status },
        }, client);
      }
    } else {
      // status === "failed"
      //
      // Capture the succeeded-payment evidence BEFORE touching any payment
      // row. On legacy per-order merchant_oids a single payment row is shared
      // by every attempt, so settling it to `failed` would erase the very
      // record the guard below reads — `hasSucceeded` would then return false
      // and the order would be failed and restocked even though money had
      // already been captured.
      const hadSucceededPayment = await PaymentModel.hasSucceeded(order.id, client);

      requireSettled(await PaymentModel.settleAttempt({
        orderId: order.id,
        provider: "paytr",
        providerSessionId: merchantOid,
        providerPaymentId: `paytr_${merchantOid}`,
        status: "failed",
        amountCents: receivedAmount || expectedAmount,
        currency: currency || order.currency,
        failureReason: failedReasonMsg
          ? `[${failedReasonCode}] ${failedReasonMsg}`
          : `Payment failed (code: ${failedReasonCode || "unknown"})`,
        rawPayload: req.body,
      }, client));

      // Mark the order failed only if it's still pending, and give the reserved
      // units back. restoreOrderStock is guarded by orders.stock_restored_at,
      // so a racing expiry sweep cannot restock the same order twice.
      if (order.status === "pending") {
        // Never release stock for an order that already has money against it.
        // Uses the value captured BEFORE the settlement above, not a fresh
        // read — a fresh read could see evidence this callback just erased.
        if (hadSucceededPayment) {
          logger.error(
            { orderId: order.id, merchantOid },
            "PayTR failure callback for an order with a succeeded payment — held for review",
          );
          await recordAuditEvent({
            userId: order.user_id,
            action: "payment.conflicting_callbacks",
            metadata: {
              orderId: order.id,
              orderNumber: order.order_number,
              merchantOid,
              requiresManualReview: true,
              detail: "A failure callback arrived for an order that already has a settled payment. Verify with PayTR.",
            },
          }, client);
        } else {
          await OrderModel.updateStatus(order.id, "failed", client);
          const restored = await restoreOrderStock(client, order.id);
          logger.info(
            { orderId: order.id, merchantOid, restored },
            "PayTR payment failed — order marked failed, stock released",
          );
        }
      }

      await recordAuditEvent({
        userId: order.user_id,
        action: "payment.failed",
        metadata: {
          orderId: order.id,
          merchantOid,
          reason: failedReasonMsg,
          code: failedReasonCode,
        },
      }, client);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    if (err === ALREADY_PROCESSED) outcome = "duplicate";
    else {
      outcome = "retry";
      failure = err;
    }
  } finally {
    // Exactly one release, on every path.
    client.release();
  }

  if (outcome === "retry") {
    // Typed refusals (ambiguous legacy attempt / unclear legacy event
    // identity) carry their own review action and operator-facing detail;
    // anything else is a plain processing failure.
    const action = failure?.reviewAction ?? "payment.webhook_processing_failed";
    const detail =
      failure?.reviewDetail ??
      "A PayTR callback could not be processed and was NOT acknowledged, so PayTR should retry it. If retries stop arriving, reconcile this payment by hand.";

    // The claim rolled back together with the effects, so this event is
    // replayable — a redelivery will process it from scratch.
    logger.error(
      { err: failure, merchantOid, action },
      failure?.reviewAction
        ? "PayTR callback REFUSED — nothing written, manual reconciliation required"
        : "PayTR callback processing FAILED — not acknowledged, awaiting retry",
    );
    // Written on the pool AFTER the transaction was released, so it survives
    // the rollback and reaches the admin review list.
    await recordAuditEvent({
      action,
      metadata: {
        merchantOid,
        status,
        totalAmount,
        ...(failure?.reviewMetadata ?? {}),
        ...(failure?.reviewAction
          ? {}
          : { error: String(failure?.message ?? failure).slice(0, 500) }),
        requiresManualReview: true,
        detail,
      },
    });
    // Non-2xx → PayTR retries. Never acknowledge work we did not commit.
    return res.status(500).type("text/plain").send("RETRY");
  }

  if (outcome === "duplicate") {
    logger.info({ merchantOid }, "PayTR callback already processed — acknowledging");
  }

  // 5. Durably processed (or a duplicate of one that was): acknowledge.
  res.status(200).type("text/plain").send("OK");
});
