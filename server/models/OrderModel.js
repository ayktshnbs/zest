// Order queries. Line items and addresses are JSONB snapshots — see
// migrations/005_create_orders.sql for the rationale.

import { query } from "../database/pool.js";
import crypto from "node:crypto";

/** Generate a human-friendly order number: ZK-20260604-AB12CD. */
const generateOrderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `ZK-${date}-${suffix}`;
};

export const create = async ({
  userId,
  currency,
  subtotalCents,
  shippingCents,
  taxCents,
  totalCents,
  items,
  shippingAddress,
  billingAddress,
  notes,
}) => {
  const orderNumber = generateOrderNumber();
  const { rows } = await query(
    `INSERT INTO orders (
       order_number, user_id, currency,
       subtotal_cents, shipping_cents, tax_cents, total_cents,
       items, shipping_address, billing_address, notes
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      orderNumber,
      userId,
      currency,
      subtotalCents,
      shippingCents,
      taxCents,
      totalCents,
      JSON.stringify(items),
      JSON.stringify(shippingAddress),
      billingAddress ? JSON.stringify(billingAddress) : null,
      notes ?? null,
    ],
  );
  return rows[0];
};

export const findById = async (id) => {
  const { rows } = await query(`SELECT * FROM orders WHERE id = $1 LIMIT 1`, [id]);
  return rows[0] ?? null;
};

export const findByIdForUser = async (id, userId) => {
  const { rows } = await query(
    `SELECT * FROM orders WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [id, userId],
  );
  return rows[0] ?? null;
};

export const listForUser = async (userId, { limit, offset }) => {
  const { rows } = await query(
    `SELECT id, order_number, status, currency, total_cents, created_at
       FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total FROM orders WHERE user_id = $1`,
    [userId],
  );
  return { rows, total: countRows[0].total };
};

export const updateStatus = async (id, status) => {
  const { rows } = await query(
    `UPDATE orders SET status = $2 WHERE id = $1 RETURNING *`,
    [id, status],
  );
  return rows[0] ?? null;
};

export const toPublic = (order) => {
  if (!order) return null;
  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    currency: order.currency,
    subtotalCents: Number(order.subtotal_cents),
    shippingCents: Number(order.shipping_cents),
    taxCents: Number(order.tax_cents),
    totalCents: Number(order.total_cents),
    items: order.items,
    shippingAddress: order.shipping_address,
    billingAddress: order.billing_address,
    notes: order.notes,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
  };
};
