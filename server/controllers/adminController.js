// Admin-only order management + stock control.
// Every route here is gated by requireAuth + requireRole('admin') (adminRoutes).

import { asyncHandler } from "../utils/asyncHandler.js";
import * as OrderModel from "../models/OrderModel.js";
import * as InventoryModel from "../models/InventoryModel.js";
import { NotFoundError } from "../utils/errors.js";
import { audit } from "../middleware/audit.js";
import { getCatalogProduct } from "../data/catalog.js";

export const listOrders = asyncHandler(async (req, res) => {
  const { page, pageSize, status } = req.validated.query;
  const offset = (page - 1) * pageSize;
  const { rows, total } = await OrderModel.listAll({ limit: pageSize, offset, status });

  res.json({
    orders: rows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      status: r.status,
      currency: r.currency,
      totalCents: Number(r.total_cents),
      createdAt: r.created_at,
      user: { email: r.user_email, name: r.user_name },
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await OrderModel.findById(req.params.id);
  if (!order) throw new NotFoundError("Order not found");
  res.json({ order: OrderModel.toPublic(order) });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await OrderModel.updateStatus(req.params.id, req.validated.body.status);
  if (!order) throw new NotFoundError("Order not found");
  await audit(req, "order.status_updated", { orderId: order.id, status: order.status });
  res.json({ order: OrderModel.toPublic(order) });
});

export const listStock = asyncHandler(async (_req, res) => {
  const rows = await InventoryModel.listAll();
  res.json({
    stock: rows.map((r) => ({
      productId: r.product_id,
      name: getCatalogProduct(r.product_id)?.name ?? null,
      stock: r.stock,
      updatedAt: r.updated_at,
    })),
  });
});

export const setStock = asyncHandler(async (req, res) => {
  const updated = await InventoryModel.setStock(
    req.params.productId,
    req.validated.body.stock,
  );
  await audit(req, "stock.set", { productId: updated.product_id, stock: updated.stock });
  res.json({ productId: updated.product_id, stock: updated.stock });
});
