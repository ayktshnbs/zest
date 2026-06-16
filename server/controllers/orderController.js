// Order lifecycle.
// Pricing is recomputed server-side from line items — the client cannot
// dictate the total it pays.

import { asyncHandler } from "../utils/asyncHandler.js";
import * as OrderModel from "../models/OrderModel.js";
import * as InventoryModel from "../models/InventoryModel.js";
import * as ProductOverrideModel from "../models/ProductOverrideModel.js";
import * as CustomProductModel from "../models/CustomProductModel.js";
import { withTransaction } from "../database/pool.js";
import { NotFoundError, BadRequestError, ConflictError } from "../utils/errors.js";
import { audit } from "../middleware/audit.js";
import {
  getCatalogProduct,
  computeShippingCents,
  CURRENCY,
} from "../data/catalog.js";

export const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, billingAddress, notes } = req.validated.body;

  // Price every line from the server-side catalog, with any admin name/price
  // override applied. Custom (admin-added) products come from the DB. Client-
  // supplied prices are ignored entirely — the client cannot dictate what it pays.
  const overrides = await ProductOverrideModel.getMap();
  const pricedItems = await Promise.all(
    items.map(async (item) => {
      const builtIn = getCatalogProduct(item.productId);
      if (builtIn) {
        const ovr = overrides[item.productId];
        return {
          productId: item.productId,
          name: ovr?.name ?? builtIn.name,
          quantity: item.quantity,
          unitPriceCents: ovr?.priceCents ?? builtIn.priceCents,
        };
      }
      // Fall back to the custom-products table; reject only if neither has it.
      const custom = await CustomProductModel.get(item.productId);
      if (!custom || !custom.is_active) {
        throw new BadRequestError(`Unknown product: ${item.productId}`);
      }
      return {
        productId: item.productId,
        name: custom.name,
        quantity: item.quantity,
        unitPriceCents: Number(custom.price_cents),
      };
    }),
  );

  const subtotalCents = pricedItems.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  );
  if (subtotalCents <= 0) throw new BadRequestError("Order subtotal must be positive");

  // Shipping is derived server-side; storefront prices are VAT-inclusive
  // ("KDV dahil"), so tax is zero here.
  const shippingCents = computeShippingCents(subtotalCents);
  const taxCents = 0;
  const totalCents = subtotalCents + shippingCents + taxCents;

  // Reserve stock and create the order atomically. Lock each product's stock
  // row (FOR UPDATE, in a stable order to avoid deadlocks between concurrent
  // checkouts), reject the whole order if anything is short, then decrement and
  // insert on the same transaction client.
  const qtyByProduct = new Map();
  for (const it of pricedItems) {
    qtyByProduct.set(it.productId, (qtyByProduct.get(it.productId) ?? 0) + it.quantity);
  }
  const productIds = [...qtyByProduct.keys()].sort();

  const order = await withTransaction(async (client) => {
    const insufficient = [];
    for (const productId of productIds) {
      const needed = qtyByProduct.get(productId);
      const row = await InventoryModel.lockForUpdate(client, productId);
      const available = row ? row.stock : 0;
      if (available < needed) {
        insufficient.push({ productId, requested: needed, available });
      }
    }
    if (insufficient.length > 0) {
      const err = new ConflictError("One or more items are out of stock");
      err.code = "out_of_stock";
      err.details = { items: insufficient };
      throw err;
    }
    for (const productId of productIds) {
      await InventoryModel.decrement(client, productId, qtyByProduct.get(productId));
    }
    return OrderModel.create(
      {
        userId: req.user.id,
        currency: CURRENCY,
        subtotalCents,
        shippingCents,
        taxCents,
        totalCents,
        items: pricedItems,
        shippingAddress,
        billingAddress,
        notes,
      },
      client,
    );
  });

  await audit(req, "order.created", {
    orderId: order.id,
    totalCents,
    currency: CURRENCY,
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
      fulfillmentStatus: r.fulfillment_status,
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
