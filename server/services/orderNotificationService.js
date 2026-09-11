// Post-payment notifications: the customer's order confirmation and the
// merchant's new-order alert.
//
// Called by the PayTR webhook AFTER it has acknowledged the callback and the
// payment transaction has committed. The emails are a courtesy layered on top
// of a payment that is already durably recorded, so this module's contract is:
//
//   * notifyOrderPaid NEVER rejects. An email-provider outage must not turn an
//     acknowledged payment into a retry, and the webhook must not await it.
//   * The two emails are independent — one failing never blocks the other.
//   * It runs on the shared pool, never on the webhook's transaction client.
//
// The caller decides WHEN: only the delivery that actually moved the order to
// `paid` triggers it, so a redelivered callback ("duplicate") or a held
// success (amount mismatch, stock gone) never re-mails.

import { config } from "../config.js";
import * as OrderModel from "../models/OrderModel.js";
import {
  sendOrderConfirmationEmail,
  sendNewOrderNotificationEmail,
} from "./emailService.js";
import { logger } from "../utils/logger.js";

export const notifyOrderPaid = async (orderId) => {
  if (!config.orderEmails.enabled) return;

  try {
    // Re-read after commit so the row reflects the committed state and carries
    // the buyer's email/name from the users join.
    const order = await OrderModel.findByIdAdmin(orderId);
    if (!order) {
      logger.warn({ orderId }, "Order emails skipped: order not found after commit");
      return;
    }
    const orderNumber = order.order_number;

    const tasks = [];
    if (order.user_email) {
      tasks.push([
        "customer_confirmation",
        sendOrderConfirmationEmail({
          to: order.user_email,
          name: order.user_name,
          order,
        }),
      ]);
    } else {
      logger.warn({ orderId, orderNumber }, "Customer confirmation skipped: no email on order");
    }
    tasks.push([
      "merchant_new_order",
      sendNewOrderNotificationEmail({
        to: config.orderEmails.notifyTo,
        order,
        customerName: order.user_name,
        customerEmail: order.user_email,
      }),
    ]);

    // allSettled never rejects; each outcome is logged on its own so a single
    // failure is visible without hiding the one that succeeded.
    const results = await Promise.allSettled(tasks.map(([, p]) => p));
    results.forEach((result, i) => {
      const kind = tasks[i][0];
      if (result.status === "rejected") {
        logger.error({ err: result.reason, orderId, orderNumber, kind }, "Order email failed");
      } else {
        logger.info({ orderId, orderNumber, kind }, "Order email sent");
      }
    });
  } catch (err) {
    // Outer guard for the order lookup or anything unforeseen — same rule:
    // log and swallow, never propagate into the payment path.
    logger.error({ err, orderId }, "Order notification failed");
  }
};
