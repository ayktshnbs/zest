// Stock queries. The `inventory` table is the source of truth for stock once
// seeded (see migrations/011_create_inventory.sql). Decrements happen inside the
// order transaction via lockForUpdate + decrement on a transaction client.

import { pool } from "../database/pool.js";

/** Public stock map { productId: stock } for the storefront. */
export const stockMap = async () => {
  const { rows } = await pool.query(`SELECT product_id, stock FROM inventory`);
  return Object.fromEntries(rows.map((r) => [r.product_id, r.stock]));
};

/** Current stock for one product, or null if untracked. */
export const getStock = async (productId) => {
  const { rows } = await pool.query(
    `SELECT stock FROM inventory WHERE product_id = $1`,
    [productId],
  );
  return rows[0]?.stock ?? null;
};

/** Admin: full stock list (product_id + level), product order. */
export const listAll = async () => {
  const { rows } = await pool.query(
    `SELECT product_id, stock, updated_at FROM inventory ORDER BY product_id`,
  );
  return rows;
};

/** Lock a single product's stock row for the duration of a transaction. */
export const lockForUpdate = async (client, productId) => {
  const { rows } = await client.query(
    `SELECT product_id, stock FROM inventory WHERE product_id = $1 FOR UPDATE`,
    [productId],
  );
  return rows[0] ?? null;
};

/** Decrement stock (guarded by the CHECK constraint stock >= 0). */
export const decrement = (client, productId, qty) =>
  client.query(`UPDATE inventory SET stock = stock - $2 WHERE product_id = $1`, [
    productId,
    qty,
  ]);

/** Admin: set an absolute stock level. */
export const setStock = async (productId, stock) => {
  const { rows } = await pool.query(
    `INSERT INTO inventory (product_id, stock) VALUES ($1, $2)
       ON CONFLICT (product_id) DO UPDATE SET stock = EXCLUDED.stock
     RETURNING product_id, stock`,
    [productId, stock],
  );
  return rows[0];
};
