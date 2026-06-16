// Admin-only order management + stock control.
// Every route here is gated by requireAuth + requireRole('admin') (adminRoutes).

import { asyncHandler } from "../utils/asyncHandler.js";
import * as OrderModel from "../models/OrderModel.js";
import * as InventoryModel from "../models/InventoryModel.js";
import { NotFoundError } from "../utils/errors.js";
import { audit } from "../middleware/audit.js";
import { getCatalogProduct, getCatalog } from "../data/catalog.js";
import * as ProductOverrideModel from "../models/ProductOverrideModel.js";

export const listOrders = asyncHandler(async (req, res) => {
  const { page, pageSize, status } = req.validated.query;
  const offset = (page - 1) * pageSize;
  const { rows, total } = await OrderModel.listAll({ limit: pageSize, offset, status });

  res.json({
    orders: rows.map((r) => ({
      id: r.id,
      orderNumber: r.order_number,
      status: r.status,
      fulfillmentStatus: r.fulfillment_status,
      currency: r.currency,
      totalCents: Number(r.total_cents),
      items: r.items,
      createdAt: r.created_at,
      user: { email: r.user_email, name: r.user_name },
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

export const getOrder = asyncHandler(async (req, res) => {
  const row = await OrderModel.findByIdAdmin(req.params.id);
  if (!row) throw new NotFoundError("Order not found");
  res.json({
    order: OrderModel.toPublic(row),
    customer: { email: row.user_email, name: row.user_name },
  });
});

export const updateOrder = asyncHandler(async (req, res) => {
  const { status, fulfillmentStatus } = req.validated.body;
  const order = await OrderModel.updateAdmin(req.params.id, { status, fulfillmentStatus });
  if (!order) throw new NotFoundError("Order not found");
  await audit(req, "order.updated", {
    orderId: order.id,
    status: order.status,
    fulfillmentStatus: order.fulfillment_status,
  });
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

// Every catalog product merged with its admin override (name/price) + stock.
export const listProducts = asyncHandler(async (_req, res) => {
  const catalog = getCatalog();
  const [overrides, stockRows] = await Promise.all([
    ProductOverrideModel.getMap(),
    InventoryModel.listAll(),
  ]);
  const stockMap = Object.fromEntries(stockRows.map((r) => [r.product_id, r.stock]));
  const products = Object.entries(catalog)
    .map(([productId, base]) => {
      const ovr = overrides[productId];
      return {
        productId,
        name: ovr?.name ?? base.name,
        defaultName: base.name,
        nameOverridden: ovr?.name != null,
        priceCents: ovr?.priceCents != null ? ovr.priceCents : base.priceCents,
        defaultPriceCents: base.priceCents,
        priceOverridden: ovr?.priceCents != null,
        stock: stockMap[productId] ?? 0,
      };
    })
    .sort((a, b) => a.productId.localeCompare(b.productId));
  res.json({ products });
});

// Edit a product's name/price override and/or stock. A present null clears the
// override (reverts to the code default).
export const updateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const base = getCatalogProduct(productId);
  if (!base) throw new NotFoundError("Unknown product");
  const body = req.validated.body;

  const ovrFields = {};
  if ("name" in body) ovrFields.name = body.name;
  if ("priceCents" in body) ovrFields.priceCents = body.priceCents;
  if (Object.keys(ovrFields).length > 0) {
    await ProductOverrideModel.set(productId, ovrFields);
  }

  let stock;
  if ("stock" in body && body.stock != null) {
    const r = await InventoryModel.setStock(productId, body.stock);
    stock = r.stock;
  } else {
    stock = await InventoryModel.getStock(productId);
  }

  await audit(req, "product.updated", { productId, fields: Object.keys(body) });

  const row = await ProductOverrideModel.get(productId);
  const oName = row?.name ?? null;
  const oPrice = row?.price_cents != null ? Number(row.price_cents) : null;
  res.json({
    product: {
      productId,
      name: oName ?? base.name,
      defaultName: base.name,
      nameOverridden: oName != null,
      priceCents: oPrice != null ? oPrice : base.priceCents,
      defaultPriceCents: base.priceCents,
      priceOverridden: oPrice != null,
      stock: stock ?? 0,
    },
  });
});
