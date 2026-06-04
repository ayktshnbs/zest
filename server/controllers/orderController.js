// Order lifecycle.
// Pricing is recomputed server-side from line items — the client cannot
// dictate the total it pays.

import { asyncHandler } from "../utils/asyncHandler.js";
import * as OrderModel from "../models/OrderModel.js";
import { NotFoundError, BadRequestError } from "../utils/errors.js";
import { audit } from "../middleware/audit.js";

export const createOrder = asyncHandler(async (req, res) => {
  const {
    items,
    shippingAddress,
    billingAddress,
    currency,
    shippingCents,
    taxCents,
    notes,
  } = req.validated.body;

  const subtotalCents = items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  );
  if (subtotalCents <= 0) throw new BadRequestError("Order subtotal must be positive");

  const totalCents = subtotalCents + shippingCents + taxCents;

  const order = await OrderModel.create({
    userId: req.user.id,
    currency,
    subtotalCents,
    shippingCents,
    taxCents,
    totalCents,
    items,
    shippingAddress,
    billingAddress,
    notes,
  });

  await audit(req, "order.created", {
    orderId: order.id,
    totalCents,
    currency,
  });

  res.status(201).json({ order: OrderModel.toPublic(order) });
});

export const listOrders = asyncHandler(async (req, res) => {
  const { page, pageSize } = req.validated.query;
  const offset = (page - 1) * pageSize;
  const { rows, total } = await OrderModel.listForUser(req.user.id, {
    limit: pageSize,
    offset,
  });

  res.json({
    orders: rows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      status: r.status,
      currency: r.currency,
      totalCents: Number(r.total_cents),
      createdAt: r.created_at,
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await OrderModel.findByIdForUser(req.params.id, req.user.id);
  if (!order) throw new NotFoundError("Order not found");
  res.json({ order: OrderModel.toPublic(order) });
});
