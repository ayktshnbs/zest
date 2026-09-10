// Payment session creation — requests a PayTR iframe token and returns it
// to the frontend. The frontend loads the token into a PayTR iframe; we
// never touch card data.

import { asyncHandler } from "../utils/asyncHandler.js";
import * as OrderModel from "../models/OrderModel.js";
import * as PaymentModel from "../models/PaymentModel.js";
import {
  createPaytrToken,
  buildMerchantOid,
  PAYTR_ATTEMPT_TIMEOUT_MINUTES,
} from "../services/paymentService.js";
import { reserveOrderStock } from "../services/stockService.js";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/errors.js";
import { audit } from "../middleware/audit.js";
import { withTransaction } from "../database/pool.js";
import { logger } from "../utils/logger.js";

// Statuses a customer may still pay for. `failed` is included so a declined
// card can be retried — its reserved stock was returned when the failure
// callback landed, so the retry re-reserves it below before charging again.
// `paid`, `cancelled` and `refunded` are terminal and never re-opened here.
const PAYABLE_STATUSES = new Set(["pending", "failed"]);

export const createCheckout = asyncHandler(async (req, res) => {
  const { orderId } = req.validated.body;

  const existing = await OrderModel.findByIdForUser(orderId, req.user.id);
  if (!existing) throw new NotFoundError("Order not found");
  if (!PAYABLE_STATUSES.has(existing.status)) {
    throw new BadRequestError(`Cannot pay an order that is ${existing.status}`);
  }

  // One transaction, with the order row locked for its whole duration. That
  // lock is what serialises concurrent createCheckout calls for the same order
  // (two browser tabs, a double-click, a retry racing a callback) — everything
  // below therefore sees a consistent view and only one caller can win.
  const { order, attempt, merchantOid, paymentId } = await withTransaction(async (client) => {
    const locked = await OrderModel.lockForUpdate(client, orderId);
    if (!locked) throw new NotFoundError("Order not found");
    if (locked.user_id !== req.user.id) throw new NotFoundError("Order not found");
    if (!PAYABLE_STATUSES.has(locked.status)) {
      throw new BadRequestError(`Cannot pay an order that is ${locked.status}`);
    }

    // ── At most ONE live payment attempt per order ───────────────────────
    // An attempt row left at 'pending' inside the PayTR timeout window means
    // a payment page for this order is still payable. Opening a second one
    // would hand the customer two live pages and let them be charged twice,
    // so refuse until the first resolves (callback) or its window lapses.
    // A declined card settles its row to 'failed', so retry-after-decline is
    // unaffected and stays immediate.
    const live = await PaymentModel.findLiveAttempt(
      client,
      orderId,
      PAYTR_ATTEMPT_TIMEOUT_MINUTES,
    );
    if (live) {
      const retryAfterSeconds = Math.max(0, Number(live.seconds_remaining) || 0);
      const err = new ConflictError(
        "Bu sipariş için başlatılmış bir ödeme işlemi zaten var. Lütfen mevcut ödemeyi tamamlayın veya birkaç dakika sonra tekrar deneyin.",
      );
      err.code = "payment_in_progress";
      err.details = { retryAfterSeconds };
      throw err;
    }

    const reservation = await reserveOrderStock(client, orderId);
    if (!reservation.ok) {
      const err = new ConflictError("One or more items are out of stock");
      err.code = "out_of_stock";
      err.details = { items: reservation.items };
      throw err;
    }

    const nextAttempt = await OrderModel.beginPaymentAttempt(client, orderId);
    const oid = buildMerchantOid(orderId, nextAttempt);

    // The attempt row is created HERE, inside the transaction, not after the
    // PayTR call. If it were created afterwards a second request could slip
    // in during the network round-trip, see no live attempt, and open a
    // parallel one — exactly the double-charge window this guard closes.
    const attemptRow = await PaymentModel.create(
      {
        orderId,
        provider: "paytr",
        providerSessionId: oid,
        amountCents: Number(locked.total_cents),
        currency: locked.currency,
        rawPayload: { merchantOid: oid, attempt: nextAttempt, createdAt: new Date().toISOString() },
      },
      client,
    );

    // Re-read so the token request sees the committed status/attempt values.
    const fresh = await OrderModel.lockForUpdate(client, orderId);
    return {
      order: fresh,
      attempt: nextAttempt,
      merchantOid: oid,
      // Kept so the token-failure path can release exactly this row by id.
      paymentId: attemptRow.id,
    };
  });

  // Determine the customer's IP for PayTR (required parameter).
  const userIp =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "127.0.0.1";

  let token;
  try {
    ({ token } = await createPaytrToken({
      order,
      user: req.user,
      userIp,
      attempt,
    }));
  } catch (err) {
    // No PayTR page was ever created, so this attempt can never be paid.
    // Settle it immediately — otherwise its 'pending' row would block the
    // customer from retrying for the whole timeout window.
    await PaymentModel.markAttemptFailed(
      paymentId,
      "PayTR session could not be created",
    ).catch((markErr) =>
      logger.error(
        { err: markErr, merchantOid, paymentId },
        "Could not release failed payment attempt",
      ),
    );
    throw err;
  }

  await audit(req, "payment.checkout_created", {
    orderId: order.id,
    merchantOid,
    attempt,
  });

  // Only the iframe token goes to the frontend — no secrets.
  res.status(201).json({ token });
});
