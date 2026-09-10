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
import * as ProductVariantModel from "../models/ProductVariantModel.js";
import * as AuditLogModel from "../models/AuditLogModel.js";
import * as cloudinary from "../services/cloudinaryService.js";
import { BadRequestError, ConflictError } from "../utils/errors.js";
import { restoreOrderStock, reserveOrderStock } from "../services/stockService.js";
import { withTransaction } from "../database/pool.js";
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
  "organizerlar",
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

// Statuses in which an order no longer holds its reserved units.
const STOCK_RELEASING_STATUSES = new Set(["cancelled", "refunded"]);

export const updateOrder = asyncHandler(async (req, res) => {
  const { status, fulfillmentStatus } = req.validated.body;

  // Status changes move inventory, so the read, the write and the stock
  // movement all happen under one transaction with the order row locked.
  // restoreOrderStock/reserveOrderStock are guarded by orders.stock_restored_at,
  // so flipping cancelled → cancelled (or double-clicking Save) cannot restock
  // the same order twice.
  const { order, stockAction } = await withTransaction(async (client) => {
    const current = await OrderModel.lockForUpdate(client, req.params.id);
    if (!current) throw new NotFoundError("Order not found");

    const nextStatus = status ?? current.status;
    const wasReleasing = STOCK_RELEASING_STATUSES.has(current.status);
    const willRelease = STOCK_RELEASING_STATUSES.has(nextStatus);

    let action = "none";
    if (!wasReleasing && willRelease) {
      const restored = await restoreOrderStock(client, req.params.id);
      action = restored ? "restored" : "already_restored";
    } else if (wasReleasing && !willRelease) {
      // Un-cancelling: take the units back so the order is honourable again.
      const reservation = await reserveOrderStock(client, req.params.id);
      if (!reservation.ok) {
        const err = new ConflictError(
          "Bu sipariş yeniden açılamıyor: ürünlerin stoğu yetersiz.",
        );
        err.code = "out_of_stock";
        err.details = { items: reservation.items };
        throw err;
      }
      action = "reserved";
    }

    const sets = [];
    const params = [req.params.id];
    if (status) {
      params.push(status);
      sets.push(`status = $${params.length}`);
    }
    if (fulfillmentStatus) {
      params.push(fulfillmentStatus);
      sets.push(`fulfillment_status = $${params.length}`);
    }
    if (sets.length === 0) return { order: current, stockAction: action };

    const { rows } = await client.query(
      `UPDATE orders SET ${sets.join(", ")} WHERE id = $1 RETURNING *`,
      params,
    );
    return { order: rows[0], stockAction: action };
  });

  await audit(req, "order.updated", {
    orderId: order.id,
    status: order.status,
    fulfillmentStatus: order.fulfillment_status,
    stockAction,
  });
  res.json({ order: OrderModel.toPublic(order) });
});

// ── Payment reviews ───────────────────────────────────────────────────
// Payment conditions that need a human: amount mismatches, probable double
// charges, orders needing a refund, callbacks we failed to process. The
// webhook writes these to audit_logs with metadata.requiresManualReview=true;
// this is the reader that was missing, so they were effectively invisible.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const listPaymentReviews = asyncHandler(async (req, res) => {
  const { page, pageSize } = req.validated.query;
  const offset = (page - 1) * pageSize;
  const { rows, total, unresolvedTotal } = await AuditLogModel.listPaymentReviews({
    limit: pageSize,
    offset,
  });

  // Enrich with each order's CURRENT state. audit_logs is append-only, so the
  // live order status is how an operator tells a handled case from an open one
  // (e.g. an amount-mismatch order still `pending` has not been dealt with).
  const orderIds = [
    ...new Set(
      rows
        .map((r) => r.metadata?.orderId)
        .filter((id) => typeof id === "string" && UUID_RE.test(id)),
    ),
  ];
  const orders = await OrderModel.findManyAdmin(orderIds);
  const byId = new Map(orders.map((o) => [o.id, o]));

  res.json({
    reviews: rows.map((r) => {
      const o = byId.get(r.metadata?.orderId) ?? null;
      return {
        id: r.id,
        action: r.action,
        createdAt: r.created_at,
        detail: r.metadata?.detail ?? null,
        merchantOid: r.metadata?.merchantOid ?? null,
        metadata: r.metadata ?? {},
        // Resolution comes from a separate append-only audit row; the incident
        // row itself is never modified.
        resolved: Boolean(r.resolved_at),
        resolvedAt: r.resolved_at ?? null,
        resolvedBy: r.resolved_by_email ?? null,
        resolutionNote: r.resolution_note ?? null,
        order: o
          ? {
              id: o.id,
              orderNumber: o.order_number,
              status: o.status,
              fulfillmentStatus: o.fulfillment_status,
              currency: o.currency,
              totalCents: Number(o.total_cents),
              customerEmail: o.user_email,
              customerName: o.user_name,
            }
          : null,
      };
    }),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    // Drives the dashboard badge — only reviews nobody has handled yet.
    unresolvedTotal,
  });
});

/**
 * Mark a payment review handled. Appends a `payment.review_resolved` audit row
 * carrying the reviewer, the timestamp and an optional note; the original
 * incident row is left untouched so the financial evidence stays immutable and
 * historically visible. Idempotent: resolving twice returns the first result.
 */
export const resolvePaymentReview = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const { note } = req.validated.body ?? {};

  const review = await AuditLogModel.findReviewById(id);
  if (!review) throw new NotFoundError("Review not found");

  // Always key the resolution off the row's OWN id as Postgres renders it
  // (canonical lower-case UUID). Using the raw request parameter would let an
  // upper-case UUID produce a resolution that never matches `a.id::text` in
  // the list query, leaving the review permanently "unresolved".
  const reviewId = String(review.id);

  // Check-then-insert must be atomic: audit_logs is append-only, so there is
  // no row to lock and no unique constraint to rely on. Two admins resolving
  // the same review at the same instant would otherwise both read "not
  // resolved" and both append a resolution row. A transaction-scoped advisory
  // lock keyed on the review id serialises them; the loser then sees the
  // winner's committed row and returns the idempotent answer.
  const result = await withTransaction(async (client) => {
    await AuditLogModel.lockReviewForResolution(client, reviewId);

    const existing = await AuditLogModel.findResolution(reviewId, client);
    if (existing) {
      return { alreadyResolved: true, resolvedAt: existing.created_at };
    }

    const created = await AuditLogModel.insert(
      {
        userId: req.user.id,
        action: AuditLogModel.REVIEW_RESOLVED_ACTION,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        metadata: {
          resolvesAuditId: reviewId,
          resolvedAction: review.action,
          orderId: review.metadata?.orderId ?? null,
          note: note ?? null,
        },
      },
      client,
    );
    return { alreadyResolved: false, resolvedAt: created.created_at };
  });

  res.json({ ok: true, ...result });
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

// Every catalog product merged with its admin override (name/price/desc) + stock.
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
        // Descriptions: only the override is stored server-side. The frontend
        // resolves defaults from the static catalog (lib/products.ts).
        shortDescriptionOverride: ovr?.shortDescription ?? null,
        descriptionOverride: ovr?.description ?? null,
        // Image override: null means "use static catalog images on disk".
        imageUrlsOverride: ovr?.imageUrls ?? null,
        // Set + badge overrides (parity with custom products in the admin
        // editor). NULL = use the static catalog default.
        volumeLabelOverride: ovr?.volumeLabel ?? null,
        setSizeOverride: ovr?.setSize ?? null,
        badgesOverride: ovr?.badges ?? null,
        // Retired built-ins stay in the admin list (so the admin can restore
        // them) but render with a faded card. Default to active.
        isActive: ovr?.isActive !== false,
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
  // Variants imply set-style products: each color carries its own stock, so
  // we skip seeding the global inventory row.
  const hasVariants = Array.isArray(body.variants) && body.variants.length > 0;
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
  if (hasVariants) {
    await ProductVariantModel.replaceAll(id, body.variants);
  } else if (body.initialStock != null) {
    // Single-stock product → seed the global inventory row.
    await InventoryModel.setStock(id, body.initialStock);
  }
  await audit(req, "custom_product.created", {
    id,
    name: row.name,
    variantCount: hasVariants ? body.variants.length : 0,
  });
  res.status(201).json({ product: CustomProductModel.toPublic(row) });
});

export const updateCustomProduct = asyncHandler(async (req, res) => {
  const body = req.validated.body;
  if (body.categorySlug) await ensureCategoryExists(body.categorySlug);
  // Strip variants before the field-by-field model update (it doesn't know that
  // key); apply variants separately if provided.
  const { variants, ...productFields } = body;
  const hasProductFields = Object.keys(productFields).length > 0;
  let row = await CustomProductModel.get(req.params.id);
  if (!row) throw new NotFoundError("Product not found");
  if (hasProductFields) {
    row = await CustomProductModel.update(req.params.id, productFields);
  }
  if (Array.isArray(variants)) {
    await ProductVariantModel.replaceAll(req.params.id, variants);
  }
  await audit(req, "custom_product.updated", {
    id: row.id,
    variantsTouched: Array.isArray(variants),
  });
  res.json({ product: CustomProductModel.toPublic(row) });
});

export const deleteCustomProduct = asyncHandler(async (req, res) => {
  const ok = await CustomProductModel.remove(req.params.id);
  if (!ok) throw new NotFoundError("Product not found");
  await audit(req, "custom_product.deleted", { id: req.params.id });
  res.status(204).end();
});

// Edit a built-in product's overrides (name/price/desc/images), stock, and
// color variants. A present null on any override clears it (reverts to the
// code default). For variants, pass the full desired list to replace, or omit
// to leave them as-is.
export const updateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const base = getCatalogProduct(productId);
  if (!base) throw new NotFoundError("Unknown product");
  const body = req.validated.body;

  const ovrFields = {};
  if ("name" in body) ovrFields.name = body.name;
  if ("priceCents" in body) ovrFields.priceCents = body.priceCents;
  if ("shortDescription" in body) ovrFields.shortDescription = body.shortDescription;
  if ("description" in body) ovrFields.description = body.description;
  if ("imageUrls" in body) ovrFields.imageUrls = body.imageUrls;
  if ("volumeLabel" in body) ovrFields.volumeLabel = body.volumeLabel;
  if ("setSize" in body) ovrFields.setSize = body.setSize;
  if ("badges" in body) ovrFields.badges = body.badges;
  if ("isActive" in body) ovrFields.isActive = body.isActive;
  if (Object.keys(ovrFields).length > 0) {
    await ProductOverrideModel.set(productId, ovrFields);
  }

  // Variants: replace-all semantics so the admin can add/remove/reorder them
  // in a single PATCH. Migration 018 lifted the FK so built-in ids work here.
  if (Array.isArray(body.variants)) {
    await ProductVariantModel.replaceAll(productId, body.variants);
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
      shortDescriptionOverride: row?.short_description ?? null,
      descriptionOverride: row?.description ?? null,
      imageUrlsOverride: row?.image_urls ?? null,
      volumeLabelOverride: row?.volume_label ?? null,
      setSizeOverride: row?.set_size ?? null,
      badgesOverride: row?.badges ?? null,
      isActive: row?.is_active !== false,
    },
  });
});
