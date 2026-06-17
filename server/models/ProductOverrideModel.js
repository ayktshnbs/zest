// Admin-editable per-product overrides (name, price, descriptions). NULL field
// = use the code/catalog default. See migrations/014_create_product_overrides
// + 016_add_description_overrides.

import { pool } from "../database/pool.js";

const SELECT_COLS = `product_id, name, price_cents, short_description, description`;

/** { productId: { name, priceCents, shortDescription, description } } for every
 *  product with an override row. NULL fields stay null (caller falls back). */
export const getMap = async () => {
  const { rows } = await pool.query(
    `SELECT ${SELECT_COLS} FROM product_overrides`,
  );
  const out = {};
  for (const r of rows) {
    out[r.product_id] = {
      name: r.name,
      priceCents: r.price_cents == null ? null : Number(r.price_cents),
      shortDescription: r.short_description,
      description: r.description,
    };
  }
  return out;
};

export const get = async (productId) => {
  const { rows } = await pool.query(
    `SELECT ${SELECT_COLS} FROM product_overrides WHERE product_id = $1`,
    [productId],
  );
  return rows[0] ?? null;
};

/**
 * Upsert override fields. Only keys PRESENT in `fields` are changed; a present
 * value of null clears that field back to the catalog default.
 *   set(id, { priceCents: 9999 })           → set price, leave others as-is
 *   set(id, { name: null })                 → clear the name override
 *   set(id, { description: "yeni metin" })  → set description override
 */
export const set = async (productId, fields) => {
  const cur =
    (await get(productId)) ?? {
      name: null,
      price_cents: null,
      short_description: null,
      description: null,
    };
  const name = "name" in fields ? fields.name : cur.name;
  const priceCents = "priceCents" in fields ? fields.priceCents : cur.price_cents;
  const shortDescription =
    "shortDescription" in fields ? fields.shortDescription : cur.short_description;
  const description = "description" in fields ? fields.description : cur.description;
  const { rows } = await pool.query(
    `INSERT INTO product_overrides
       (product_id, name, price_cents, short_description, description)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (product_id) DO UPDATE
       SET name = EXCLUDED.name,
           price_cents = EXCLUDED.price_cents,
           short_description = EXCLUDED.short_description,
           description = EXCLUDED.description
     RETURNING ${SELECT_COLS}`,
    [productId, name, priceCents, shortDescription, description],
  );
  return rows[0];
};
