// Wishlist / favorites queries. UNIQUE(user_id, product_id) makes the
// add operation naturally idempotent via ON CONFLICT DO NOTHING.

import { query } from "../database/pool.js";

export const listForUser = async (userId) => {
  const { rows } = await query(
    `SELECT product_id, created_at
       FROM favorites
      WHERE user_id = $1
      ORDER BY created_at DESC`,
    [userId],
  );
  return rows;
};

export const add = async (userId, productId) => {
  await query(
    `INSERT INTO favorites (user_id, product_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, product_id) DO NOTHING`,
    [userId, productId],
  );
};

export const remove = async (userId, productId) => {
  await query(
    `DELETE FROM favorites WHERE user_id = $1 AND product_id = $2`,
    [userId, productId],
  );
};

/**
 * Bulk add — used when an anonymous wishlist gets merged into a fresh
 * login session. Trims to a hard cap so a malicious client can't blow
 * up the user's row count.
 */
export const addMany = async (userId, productIds) => {
  if (!productIds || productIds.length === 0) return;
  const trimmed = productIds.slice(0, 500);
  await query(
    `INSERT INTO favorites (user_id, product_id)
     SELECT $1, p FROM unnest($2::text[]) AS p
     ON CONFLICT (user_id, product_id) DO NOTHING`,
    [userId, trimmed],
  );
};

export const clearForUser = async (userId) => {
  await query(`DELETE FROM favorites WHERE user_id = $1`, [userId]);
};
