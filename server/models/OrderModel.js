// Order queries. Line items and addresses are JSONB snapshots — see
// migrations/005_create_orders.sql for the rationale.

import { query, pool } from "../database/pool.js";
import crypto from "node:crypto";

/** Generate a human-friendly order number: ZK-20260604-AB12CD. */
const generateOrderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `ZK-${date}-${suffix}`;
};

// `db` defaults to the shared pool but accepts a transaction client so the
// insert can run in the same transaction as the stock decrement.
export const create = async (
  {
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
  },
  db = pool,
) => {
  const orderNumber = generateOrderNumber();
  const { rows } = await db.query(
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
    `SELECT id, order_number, status, fulfillment_status, currency, total_cents, created_at
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

// Admin: every order, newest first, with the buyer's identity. Optional status filter.
export const listAll = async ({ limit, offset, status }) => {
  const params = [limit, offset];
  let where = "";
  if (status) {
    params.push(status);
    where = `WHERE o.status = $${params.length}`;
  }
  const { rows } = await query(
    `SELECT o.id, o.order_number, o.status, o.fulfillment_status, o.currency,
            o.total_cents, o.items, o.created_at,
            u.email AS user_email, u.name AS user_name
       FROM orders o
       JOIN users u ON u.id = o.user_id
       ${where}
      ORDER BY o.created_at DESC
      LIMIT $1 OFFSET $2`,
    params,
  );
  const { rows: countRows } = await query(
    `SELECT COUNT(*)::int AS total FROM orders ${status ? "WHERE status = $1" : ""}`,
    status ? [status] : [],
  );
  return { rows, total: countRows[0].total };
};

/**
 * Admin: several orders by id, with the buyer's identity. Used to enrich the
 * payment-review list. Ids MUST already be validated as UUIDs by the caller —
 * the ::uuid[] cast throws on malformed input.
 */
export const findManyAdmin = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const { rows } = await query(
    `SELECT o.id, o.order_number, o.status, o.fulfillment_status,
            o.currency, o.total_cents, o.created_at,
            u.email AS user_email, u.name AS user_name
       FROM orders o
       JOIN users u ON u.id = o.user_id
      WHERE o.id = ANY($1::uuid[])`,
    [ids],
  );
  return rows;
};

// Admin: a single order joined with the buyer's identity.
export const findByIdAdmin = async (id) => {
  const { rows } = await query(
    `SELECT o.*, u.email AS user_email, u.name AS user_name
       FROM orders o
       JOIN users u ON u.id = o.user_id
      WHERE o.id = $1
      LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
};

/** Lock one order row for the duration of a transaction. */
export const lockForUpdate = async (client, id) => {
  const { rows } = await client.query(
    `SELECT * FROM orders WHERE id = $1 FOR UPDATE`,
    [id],
  );
  return rows[0] ?? null;
};

/**
 * Claim the next payment attempt for an order and put it back in `pending`.
 * The returned counter is what makes each PayTR merchant_oid unique, so this
 * must run inside the same transaction that re-reserves stock.
 */
export const beginPaymentAttempt = async (client, id) => {
  const { rows } = await client.query(
    `UPDATE orders
        SET payment_attempts = payment_attempts + 1,
            status = 'pending'
      WHERE id = $1
      RETURNING payment_attempts`,
    [id],
  );
  return rows[0]?.payment_attempts ?? null;
};

export const updateStatus = async (id, status, db = pool) => {
  const { rows } = await db.query(
    `UPDATE orders SET status = $2 WHERE id = $1 RETURNING *`,
    [id, status],
  );
  return rows[0] ?? null;
};

// NOTE: the admin status update used to live here as `updateAdmin`. It now
// happens inside adminController.updateOrder's transaction, because changing
// an order to/from cancelled/refunded has to move inventory in the same
// atomic step (services/stockService.js). A standalone helper that wrote the
// status without touching stock is a trap, so it is deliberately gone.

export const toPublic = (order) => {
  if (!order) return null;
  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    fulfillmentStatus: order.fulfillment_status,
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
