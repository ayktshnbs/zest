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
//   return 0 rows, and we skip — stock is restored at most once per order.
//   Only `pending` orders are ever touched; paid/shipped/delivered/cancelled/
//   refunded orders can never match the claim.
//
// Stock restore mirrors the decrement in orderController:
//   items with variantId  → product_variants.stock += qty
//   items without         → inventory.stock        += qty

import { pool, withTransaction } from "../database/pool.js";
import { recordAuditEvent } from "../services/auditService.js";
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
    `SELECT id, order_number, items
       FROM orders
      WHERE status = 'pending'
        AND created_at < NOW() - ($1 || ' minutes')::interval
      ORDER BY created_at
      LIMIT 200`,
    [String(ttlMinutes)],
  );

  let cancelled = 0;
  for (const order of candidates) {
    try {
      const done = await withTransaction(async (client) => {
        // Claim: flips pending→cancelled or tells us someone else got here
        // first (another runner, or a payment webhook marking it paid).
        const { rows } = await client.query(
          `UPDATE orders SET status = 'cancelled'
            WHERE id = $1 AND status = 'pending'
            RETURNING items`,
          [order.id],
        );
        if (rows.length === 0) return false;

        const items = Array.isArray(rows[0].items) ? rows[0].items : [];
        for (const item of items) {
          const qty = Number(item.quantity) || 0;
          if (qty <= 0) continue;
          if (item.variantId) {
            await client.query(
              `UPDATE product_variants SET stock = stock + $2 WHERE id = $1`,
              [item.variantId, qty],
            );
          } else if (item.productId) {
            await client.query(
              `UPDATE inventory SET stock = stock + $2 WHERE product_id = $1`,
              [item.productId, qty],
            );
          }
        }
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
