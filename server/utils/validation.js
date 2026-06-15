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

// Only productId + quantity are trusted from the client. Price, shipping, tax
// and currency are all computed server-side (see orderController.createOrder)
// from the authoritative catalog — never from the request body.
const orderItemSchema = z.object({
  productId: z.string().min(1).max(120),
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
  "fulfilled",
  "cancelled",
  "refunded",
]);

export const adminOrderListSchema = paginationSchema.extend({
  status: orderStatusSchema.optional(),
});

export const updateOrderStatusSchema = z.object({ status: orderStatusSchema });

export const setStockSchema = z.object({
  stock: z.number().int().min(0).max(1_000_000),
});
