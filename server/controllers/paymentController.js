// Payment session creation — requests a PayTR iframe token and returns it
// to the frontend. The frontend loads the token into a PayTR iframe; we
// never touch card data.

import { asyncHandler } from "../utils/asyncHandler.js";
import * as OrderModel from "../models/OrderModel.js";
import * as PaymentModel from "../models/PaymentModel.js";
import { createPaytrToken } from "../services/paymentService.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";
import { audit } from "../middleware/audit.js";

export const createCheckout = asyncHandler(async (req, res) => {
  const { orderId } = req.validated.body;

  const order = await OrderModel.findByIdForUser(orderId, req.user.id);
  if (!order) throw new NotFoundError("Order not found");
  if (order.status !== "pending") {
    throw new BadRequestError(`Cannot pay an order that is ${order.status}`);
  }

  // Determine the customer's IP for PayTR (required parameter).
  const userIp =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "127.0.0.1";

  const { token, merchantOid } = await createPaytrToken({
    order,
    user: req.user,
    userIp,
  });

  // Record the pending payment so the webhook can correlate later.
  await PaymentModel.create({
    orderId: order.id,
    provider: "paytr",
    providerSessionId: merchantOid,
    amountCents: Number(order.total_cents),
    currency: order.currency,
    rawPayload: { merchantOid, createdAt: new Date().toISOString() },
  });

  await audit(req, "payment.checkout_created", {
    orderId: order.id,
    merchantOid,
  });

  // Only the iframe token goes to the frontend — no secrets.
  res.status(201).json({ token });
});
