// Pending-order expiry: cancels orders stuck in `pending` payment status for
// longer than ORDER_PENDING_TTL_MINUTES and returns their reserved stock.
//
// Why this exists: stock is decremented transactionally when the order is
// CREATED (so two shoppers can't buy the last unit), which means an abandoned
// checkout holds inventory forever unless something releases it. This job is
// that something.
//
// Idempotency contract (safe to run concurrently / repeatedly):
//   Each order is claimed with
//     UPDATE orders SET status='cancelled' WHERE id=$1 AND status='pending'
//   inside its own transaction. The status guard means a second runner (or a
//   webhook flipping the order to 'paid' at the same instant) makes the claim
//   return 0 rows, and we skip. The restore itself is guarded a second time by
//   orders.stock_restored_at (services/stockService.js), so even a path that
//   somehow bypassed the status claim cannot hand the same units out twice.
//
// Money safety: an order that already has a SUCCEEDED payment row is never
// touched, even while its status still reads 'pending'. That happens when a
// callback arrived with a mismatched amount (webhookController parks the order
// for review rather than marking it paid) — cancelling it here would restock
// goods the customer has already been charged for.

import { pool, withTransaction } from "../database/pool.js";
import { recordAuditEvent } from "../services/auditService.js";
import { restoreOrderStock } from "../services/stockService.js";
import { logger } from "../utils/logger.js";
import { config } from "../config.js";

/**
 * Cancel pending orders older than `ttlMinutes` and restore their stock.
 * Returns { scanned, cancelled } counts. Logs order ids + item counts only —
 * never customer names, addresses, or payment details.
 */
export const expirePendingOrders = async (
  ttlMinutes = config.orderExpiry.ttlMinutes,
) => {
  // Candidate scan is outside the per-order transactions on purpose: it's a
  // cheap read, and the real claim happens row-by-row with the status guard.
  const { rows: candidates } = await pool.query(
    `SELECT o.id, o.order_number
       FROM orders o
      WHERE o.status = 'pending'
        AND o.created_at < NOW() - ($1 || ' minutes')::interval
        AND NOT EXISTS (
          SELECT 1 FROM payments p
           WHERE p.order_id = o.id
             AND (
               -- money already moved: never cancel/restock it here
               p.status = 'succeeded'
               -- or a payment attempt started recently: the shopper may be on
               -- the PayTR page right now. Retries reuse the original order, so
               -- created_at alone would let an old order be swept mid-payment.
               OR p.created_at > NOW() - ($1 || ' minutes')::interval
             )
        )
      ORDER BY o.created_at
      LIMIT 200`,
    [String(ttlMinutes)],
  );

  let cancelled = 0;
  for (const order of candidates) {
    try {
      const done = await withTransaction(async (client) => {
        // Claim: flips pending→cancelled or tells us someone else got here
        // first (another runner, or a payment webhook marking it paid).
        // The payment guard is re-checked inside the transaction — a
        // settlement or a retry may have landed between the candidate scan
        // and this claim.
        const { rows } = await client.query(
          `UPDATE orders SET status = 'cancelled'
            WHERE id = $1 AND status = 'pending'
              AND NOT EXISTS (
                SELECT 1 FROM payments p
                 WHERE p.order_id = orders.id
                   AND (
                     p.status = 'succeeded'
                     OR p.created_at > NOW() - ($2 || ' minutes')::interval
                   )
              )
            RETURNING id`,
          [order.id, String(ttlMinutes)],
        );
        if (rows.length === 0) return false;

        // Exactly-once restore, guarded by orders.stock_restored_at.
        await restoreOrderStock(client, order.id);
        return true;
      });

      if (done) {
        cancelled += 1;
        logger.info(
          { orderId: order.id, orderNumber: order.order_number, ttlMinutes },
          "Expired pending order; stock restored",
        );
        await recordAuditEvent({
          action: "order.expired",
          metadata: { orderId: order.id, orderNumber: order.order_number },
        });
      }
    } catch (err) {
      // One bad order must not stop the sweep. The next run retries it.
      logger.error({ err, orderId: order.id }, "Failed to expire pending order");
    }
  }

  if (candidates.length > 0) {
    logger.info(
      { scanned: candidates.length, cancelled, ttlMinutes },
      "Pending-order expiry sweep finished",
    );
  }
  return { scanned: candidates.length, cancelled };
};

/**
 * In-process scheduler. Started from server.js when ORDER_EXPIRY_ENABLED is
 * true (the default). setInterval is fine here: the claim query makes the job
 * idempotent, so even multiple web instances running it concurrently can't
 * double-restore stock.
 */
export const startOrderExpiryScheduler = () => {
  if (!config.orderExpiry.enabled) {
    logger.info("Order expiry scheduler disabled (ORDER_EXPIRY_ENABLED=false)");
    return null;
  }
  const intervalMs = config.orderExpiry.intervalMinutes * 60 * 1000;
  logger.info(
    {
      ttlMinutes: config.orderExpiry.ttlMinutes,
      intervalMinutes: config.orderExpiry.intervalMinutes,
    },
    "Order expiry scheduler started",
  );
  // Run once shortly after boot so a long downtime doesn't leave stale
  // pendings waiting a full interval.
  const kickoff = setTimeout(() => {
    expirePendingOrders().catch((err) =>
      logger.error({ err }, "Order expiry initial run failed"),
    );
  }, 15_000);
  kickoff.unref?.();

  const timer = setInterval(() => {
    expirePendingOrders().catch((err) =>
      logger.error({ err }, "Order expiry sweep failed"),
    );
  }, intervalMs);
  timer.unref?.(); // never keep the process alive just for the sweep
  return timer;
};
