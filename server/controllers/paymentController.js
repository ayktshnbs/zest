// Payment session creation — hits Creem and returns a redirect URL.

import { asyncHandler } from "../utils/asyncHandler.js";
import * as OrderModel from "../models/OrderModel.js";
import * as PaymentModel from "../models/PaymentModel.js";
import { createCheckoutSession } from "../services/paymentService.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";
import { audit } from "../middleware/audit.js";

export const createCheckout = asyncHandler(async (req, res) => {
  const { orderId } = req.validated.body;

  const order = await OrderModel.findByIdForUser(orderId, req.user.id);
  if (!order) throw new NotFoundError("Order not found");
  if (order.status !== "pending") {
    throw new BadRequestError(`Cannot pay an order that is ${order.status}`);
  }

  const session = await createCheckoutSession({ order, user: req.user });

  await PaymentModel.create({
    orderId: order.id,
    providerSessionId: session.sessionId,
    amountCents: Number(order.total_cents),
    currency: order.currency,
    rawPayload: session.raw,
  });

  await audit(req, "payment.checkout_created", {
    orderId: order.id,
    sessionId: session.sessionId,
  });

  res.status(201).json({
    checkoutUrl: session.url,
    sessionId: session.sessionId,
  });
});
