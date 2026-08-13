// PayTR callback (bildirim) handler.
//
// Critical contract:
//   1. PayTR POSTs application/x-www-form-urlencoded data.
//   2. Verify HMAC hash BEFORE processing.
//   3. Use webhook_events for idempotency — same merchant_oid never processed twice.
//   4. Update payment + order status inside a DB transaction.
//   5. ALWAYS return plain-text "OK" (HTTP 200) after claiming the event,
//      even on processing errors. Otherwise PayTR retries endlessly.

import { pool } from "../database/pool.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyPaytrHash } from "../services/paymentService.js";
import * as WebhookEventModel from "../models/WebhookEventModel.js";
import * as PaymentModel from "../models/PaymentModel.js";
import * as OrderModel from "../models/OrderModel.js";
import { recordAuditEvent } from "../services/auditService.js";
import { logger } from "../utils/logger.js";

/**
 * Extract the order UUID from a merchant_oid like "PAYTR-{uuid}".
 */
const parseOrderId = (merchantOid) => {
  if (!merchantOid) return null;
  const str = String(merchantOid);
  return str.startsWith("PAYTR-") ? str.slice(6) : str;
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
  const hashValid = verifyPaytrHash({
    merchantOid,
    status,
    totalAmount,
    hash,
  });

  if (!hashValid) {
    logger.warn(
      { merchantOid, ip: req.ip },
      "PayTR callback rejected: invalid hash",
    );
    // PayTR expects "OK" even on rejection to stop retries. However, for
    // an invalid hash we return a non-OK response so PayTR knows we
    // didn't accept it — this is a security boundary.
    return res.status(400).type("text/plain").send("HASH_MISMATCH");
  }

  // 3. Idempotent claim — if this returns null, we already processed it.
  const eventId = `paytr-${merchantOid}`;
  const eventType = status === "success" ? "payment.succeeded" : "payment.failed";

  const claim = await WebhookEventModel.tryClaim({
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
  });

  if (!claim) {
    // Already processed — acknowledge to stop retries.
    return res.status(200).type("text/plain").send("OK");
  }

  // 4. Process the callback atomically within a transaction
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const orderId = parseOrderId(merchantOid);
    if (!orderId) throw new Error(`Cannot parse order ID from ${merchantOid}`);

    // Lock the order row to prevent concurrent modifications during the transaction.
    const { rows } = await client.query("SELECT * FROM orders WHERE id = $1 FOR UPDATE", [orderId]);
    const order = rows[0];
    
    if (!order) throw new Error(`Unknown order ${orderId}`);

    // Verify amount matches what we expect (kuruş).
    const expectedAmount = Number(order.total_cents);
    const receivedAmount = Number(totalAmount);
    if (expectedAmount !== receivedAmount) {
      logger.warn(
        { merchantOid, expected: expectedAmount, received: receivedAmount },
        "PayTR callback amount mismatch",
      );
    }

    if (status === "success") {
      await PaymentModel.upsertFromWebhook({
        orderId: order.id,
        provider: "paytr",
        providerSessionId: merchantOid,
        providerPaymentId: `paytr_${merchantOid}`,
        status: "succeeded",
        amountCents: receivedAmount,
        currency: currency || order.currency,
        rawPayload: req.body,
      }, client);

      // Only transition pending → paid (don't regress a later status).
      if (order.status === "pending" && expectedAmount === receivedAmount) {
        await OrderModel.updateStatus(order.id, "paid", client);
      }

      await recordAuditEvent({
        userId: order.user_id,
        action: "payment.succeeded",
        metadata: { orderId: order.id, merchantOid, paymentType },
      });
    } else {
      // status === "failed"
      await PaymentModel.upsertFromWebhook({
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
      }, client);

      // Mark order as failed only if it's still pending.
      if (order.status === "pending") {
        await OrderModel.updateStatus(order.id, "failed", client);
      }

      await recordAuditEvent({
        action: "payment.failed",
        metadata: {
          orderId: order.id,
          merchantOid,
          reason: failedReasonMsg,
          code: failedReasonCode,
        },
      });
    }

    // Mark the idempotency record as processed within the transaction.
    // If the transaction fails, the 'processed' status update is rolled back,
    // leaving it in 'received' status for debugging. It won't be retried because
    // the webhook_events row exists, but at least the database state remains consistent.
    await client.query(
      `UPDATE webhook_events SET status = 'processed', processed_at = NOW(), error = NULL WHERE id = $1`,
      [claim.id]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error({ err, merchantOid }, "PayTR callback processing failed");
    await WebhookEventModel.markFailed(claim.id, err.message ?? String(err));
  } finally {
    client.release();
  }

  // 5. Always return plain "OK" to PayTR.
  res.status(200).type("text/plain").send("OK");
});
