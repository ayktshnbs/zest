// Reusable zod schemas. Controllers pull these into route definitions via
// the `validate` middleware.

import { z } from "zod";

// Email — lowercased, trimmed, RFC-ish.
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address")
  .max(254);

// Password policy: 8+ chars with at least one letter and one digit.
// Tune to taste; keep it strict enough to be useful, not annoying.
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), {
    message: "Password must contain both letters and digits",
  });

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(120);

export const uuidSchema = z.string().uuid("Invalid identifier");

// ── Auth ─────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(128),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(256),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(20).max(256),
});

export const googleSignInSchema = z.object({
  id_token: z.string().min(20),
});

// ── User ─────────────────────────────────────────────────────────────
export const updateProfileSchema = z
  .object({
    name: nameSchema.optional(),
    email: emailSchema.optional(),
  })
  .refine((v) => v.name || v.email, {
    message: "Provide name or email to update",
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: passwordSchema,
});

// ── Orders ───────────────────────────────────────────────────────────
const addressSchema = z.object({
  fullName: z.string().trim().min(1).max(160),
  phone: z.string().trim().min(3).max(40).optional(),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().min(1).max(20),
  country: z.string().trim().min(2).max(2), // ISO 3166-1 alpha-2
});

// Only productId (+ optional colorKey for variant products) + quantity are
// trusted from the client. Price, shipping, tax and currency are computed
// server-side (see orderController.createOrder) from the authoritative catalog
// — never from the request body.
const orderItemSchema = z.object({
  productId: z.string().min(1).max(120),
  colorKey: z.string().min(1).max(40).optional(),
  quantity: z.number().int().positive().max(999),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "At least one item required").max(100),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  notes: z.string().max(2000).optional(),
});

// ── Payments ─────────────────────────────────────────────────────────
export const createCheckoutSchema = z.object({
  orderId: uuidSchema,
});

// ── Pagination ───────────────────────────────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().max(10_000).default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

// ── Admin ────────────────────────────────────────────────────────────
// Mirrors the orders.status CHECK constraint (migrations/005_create_orders.sql).
export const orderStatusSchema = z.enum([
  "pending",
  "paid",
  "failed",
  "cancelled",
  "refunded",
]);

export const adminOrderListSchema = paginationSchema.extend({
  status: orderStatusSchema.optional(),
});

export const updateOrderStatusSchema = z.object({ status: orderStatusSchema });

export const fulfillmentStatusSchema = z.enum([
  "processing",
  "packed",
  "shipped",
  "delivered",
  "returned",
]);

// Admin order edit: payment status and/or fulfillment status (at least one).
export const updateOrderSchema = z
  .object({
    status: orderStatusSchema.optional(),
    fulfillmentStatus: fulfillmentStatusSchema.optional(),
  })
  .refine((v) => v.status || v.fulfillmentStatus, {
    message: "Provide status or fulfillmentStatus",
  });

export const setStockSchema = z.object({
  stock: z.number().int().min(0).max(1_000_000),
});

// Admin product edit. Each field is optional; a present null clears that
// override (reverts to the catalog default). Price is in integer kuruş.
export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1).max(200).nullable().optional(),
    priceCents: z.number().int().min(0).max(100_000_000).nullable().optional(),
    stock: z.number().int().min(0).max(1_000_000).optional(),
    shortDescription: z.string().trim().max(500).nullable().optional(),
    description: z.string().trim().max(5000).nullable().optional(),
  })
  .refine(
    (v) =>
      "name" in v ||
      "priceCents" in v ||
      "stock" in v ||
      "shortDescription" in v ||
      "description" in v,
    { message: "Provide at least one of name, priceCents, stock, shortDescription, description" },
  );

// Admin-managed categories.
const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(60)
  .regex(slugRe, "Lowercase letters, digits, and dashes only");

export const createCategorySchema = z.object({
  slug: slugSchema,
  label: z.string().trim().min(1).max(80),
  imageUrl: z.string().url().max(500).optional().nullable(),
  displayOrder: z.number().int().min(0).max(10_000).optional(),
});

export const updateCategorySchema = z
  .object({
    label: z.string().trim().min(1).max(80).optional(),
    imageUrl: z.string().url().max(500).nullable().optional(),
    displayOrder: z.number().int().min(0).max(10_000).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field" });

// Custom (admin-added) products. categorySlug is validated against existing
// built-in or DB categories in the controller.
// One color variant inside a product. `colorKey` is a url-safe slug used as
// the variant's stable identifier in the cart / order; `colorHex` paints the
// swatch on the product page.
const colorKeyRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const productVariantSchema = z.object({
  colorKey: z.string().trim().min(1).max(40).regex(colorKeyRe),
  colorLabel: z.string().trim().min(1).max(60),
  colorHex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Hex format: #RRGGBB"),
  stock: z.number().int().min(0).max(1_000_000).optional(),
  imageUrls: z.array(z.string().url().max(500)).max(20).optional(),
});

export const createCustomProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  categorySlug: slugSchema,
  priceCents: z.number().int().min(0).max(100_000_000),
  shortDescription: z.string().trim().max(500).optional().nullable(),
  description: z.string().trim().max(5000).optional().nullable(),
  imageUrls: z.array(z.string().url().max(500)).max(20).optional(),
  badges: z
    .object({
      isNew: z.boolean().optional(),
      isBestSeller: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
    })
    .optional(),
  isActive: z.boolean().optional(),
  initialStock: z.number().int().min(0).max(1_000_000).optional(),
  // Set-style products (storage container sets): structural fields + variants.
  volumeLabel: z.string().trim().max(40).optional().nullable(),
  setSize: z.number().int().positive().max(999).optional().nullable(),
  variants: z.array(productVariantSchema).max(20).optional(),
});

export const updateCustomProductSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    categorySlug: slugSchema.optional(),
    priceCents: z.number().int().min(0).max(100_000_000).optional(),
    shortDescription: z.string().trim().max(500).nullable().optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    imageUrls: z.array(z.string().url().max(500)).max(20).optional(),
    badges: z
      .object({
        isNew: z.boolean().optional(),
        isBestSeller: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
      })
      .optional(),
    isActive: z.boolean().optional(),
    volumeLabel: z.string().trim().max(40).nullable().optional(),
    setSize: z.number().int().positive().max(999).nullable().optional(),
    variants: z.array(productVariantSchema).max(20).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field" });

// Sign request — type identifies the upload target ("products" | "categories").
export const signUploadSchema = z.object({
  type: z.enum(["products", "categories"]),
});
