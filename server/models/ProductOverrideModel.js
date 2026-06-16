// Admin-editable per-product overrides (name, price). NULL field = use the
// code/catalog default. See migrations/014_create_product_overrides.sql.

import { pool } from "../database/pool.js";

/** { productId: { name, priceCents } } for every product with an override row. */
export const getMap = async () => {
  const { rows } = await pool.query(
    `SELECT product_id, name, price_cents FROM product_overrides`,
  );
  const out = {};
  for (const r of rows) {
    out[r.product_id] = {
      name: r.name,
      priceCents: r.price_cents == null ? null : Number(r.price_cents),
    };
  }
  return out;
};

export const get = async (productId) => {
  const { rows } = await pool.query(
    `SELECT product_id, name, price_cents FROM product_overrides WHERE product_id = $1`,
    [productId],
  );
  return rows[0] ?? null;
};

/**
 * Upsert override fields. Only keys PRESENT in `fields` are changed; a present
 * value of null clears that field back to the catalog default.
 *   set(id, { priceCents: 9999 })      → set price, leave name as-is
 *   set(id, { name: null })            → clear the name override
 */
export const set = async (productId, fields) => {
  const cur = (await get(productId)) ?? { name: null, price_cents: null };
  const name = "name" in fields ? fields.name : cur.name;
  const priceCents = "priceCents" in fields ? fields.priceCents : cur.price_cents;
  const { rows } = await pool.query(
    `INSERT INTO product_overrides (product_id, name, price_cents)
       VALUES ($1, $2, $3)
     ON CONFLICT (product_id)
       DO UPDATE SET name = EXCLUDED.name, price_cents = EXCLUDED.price_cents
     RETURNING product_id, name, price_cents`,
    [productId, name, priceCents],
  );
  return rows[0];
};
