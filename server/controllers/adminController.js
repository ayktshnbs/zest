// Admin-only order management + stock control.
// Every route here is gated by requireAuth + requireRole('admin') (adminRoutes).

import { asyncHandler } from "../utils/asyncHandler.js";
import * as OrderModel from "../models/OrderModel.js";
import * as InventoryModel from "../models/InventoryModel.js";
import { NotFoundError } from "../utils/errors.js";
import { audit } from "../middleware/audit.js";
import { getCatalogProduct, getCatalog } from "../data/catalog.js";
import * as ProductOverrideModel from "../models/ProductOverrideModel.js";
import * as CategoryModel from "../models/CategoryModel.js";
import * as CustomProductModel from "../models/CustomProductModel.js";
import * as cloudinary from "../services/cloudinaryService.js";
import { BadRequestError, ConflictError } from "../utils/errors.js";
import crypto from "node:crypto";

// Built-in storefront category slugs (mirrors lib/categories.ts). Admin can
// assign custom products to either a built-in or a DB-managed category.
const BUILTIN_CATEGORY_SLUGS = new Set([
  "mutfak",
  "saklama-kaplari",
  "dograyicilar-rendeler",
  "servis-sofra",
  "mutfak-yardimcilari",
  "genel-ev-urunleri",
]);

const ensureCategoryExists = async (slug) => {
  if (BUILTIN_CATEGORY_SLUGS.has(slug)) return true;
  const row = await CategoryModel.get(slug);
  if (!row) throw new BadRequestError(`Unknown category: ${slug}`);
  return true;
};

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

// ── Cloudinary uploads ────────────────────────────────────────────────
// Browser uploads images straight to Cloudinary using this signed payload.
// The API secret never leaves the server.
export const signUpload = asyncHandler(async (req, res) => {
  const { type } = req.validated.body;
  const folder = `zest-home/${type}`;
  const payload = cloudinary.sign({ folder });
  res.json(payload);
});

// ── Admin-managed categories ──────────────────────────────────────────
export const listCategories = asyncHandler(async (_req, res) => {
  const rows = await CategoryModel.listAll();
  res.json({ categories: rows.map(CategoryModel.toPublic) });
});

export const createCategory = asyncHandler(async (req, res) => {
  const body = req.validated.body;
  if (BUILTIN_CATEGORY_SLUGS.has(body.slug)) {
    throw new ConflictError("This slug is reserved for a built-in category");
  }
  const existing = await CategoryModel.get(body.slug);
  if (existing) throw new ConflictError("A category with this slug already exists");
  const row = await CategoryModel.create(body);
  await audit(req, "category.created", { slug: row.slug });
  res.status(201).json({ category: CategoryModel.toPublic(row) });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const row = await CategoryModel.update(req.params.slug, req.validated.body);
  if (!row) throw new NotFoundError("Category not found");
  await audit(req, "category.updated", { slug: row.slug });
  res.json({ category: CategoryModel.toPublic(row) });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  try {
    const ok = await CategoryModel.remove(req.params.slug);
    if (!ok) throw new NotFoundError("Category not found");
    await audit(req, "category.deleted", { slug: req.params.slug });
    res.status(204).end();
  } catch (err) {
    if (err.code === "category_not_empty") {
      throw new ConflictError(
        `Cannot delete: ${err.count} product(s) still in this category`,
      );
    }
    throw err;
  }
});

// ── Custom (admin-added) products ─────────────────────────────────────
export const listCustomProducts = asyncHandler(async (_req, res) => {
  const rows = await CustomProductModel.listAll();
  res.json({ products: rows.map(CustomProductModel.toPublic) });
});

export const createCustomProduct = asyncHandler(async (req, res) => {
  const body = req.validated.body;
  await ensureCategoryExists(body.categorySlug);
  // Stable, slug-safe id with a short random suffix to avoid collisions.
  const trMap = { "ı": "i", "İ": "i", "ş": "s", "Ş": "s", "ğ": "g", "Ğ": "g",
                  "ü": "u", "Ü": "u", "ö": "o", "Ö": "o", "ç": "c", "Ç": "c" };
  const base = body.name
    .toLowerCase()
    .replace(/[ıİşŞğĞüÜöÖçÇ]/g, (ch) => trMap[ch] ?? ch)
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "urun";
  const id = `c-${base}-${crypto.randomBytes(3).toString("hex")}`;
  const row = await CustomProductModel.create({ id, ...body });
  // Seed inventory if requested (otherwise it'll show as 0 stock).
  if (body.initialStock != null) {
    await InventoryModel.setStock(id, body.initialStock);
  }
  await audit(req, "custom_product.created", { id, name: row.name });
  res.status(201).json({ product: CustomProductModel.toPublic(row) });
});

export const updateCustomProduct = asyncHandler(async (req, res) => {
  const body = req.validated.body;
  if (body.categorySlug) await ensureCategoryExists(body.categorySlug);
  const row = await CustomProductModel.update(req.params.id, body);
  if (!row) throw new NotFoundError("Product not found");
  await audit(req, "custom_product.updated", { id: row.id });
  res.json({ product: CustomProductModel.toPublic(row) });
});

export const deleteCustomProduct = asyncHandler(async (req, res) => {
  const ok = await CustomProductModel.remove(req.params.id);
  if (!ok) throw new NotFoundError("Product not found");
  await audit(req, "custom_product.deleted", { id: req.params.id });
  res.status(204).end();
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
