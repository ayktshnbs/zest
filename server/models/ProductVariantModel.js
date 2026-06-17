// Color variants for custom products (set-style storage containers, etc).
// See migrations/017_create_product_variants.sql. One row per (product, color);
// variant.stock is the source of truth — inventory table is unused for products
// that have variants.

import { pool } from "../database/pool.js";

const SELECT = `
  SELECT id, product_id, color_key, color_label, color_hex, stock,
         image_urls, position, created_at, updated_at
    FROM product_variants
`;

/** All variants for one product, in display order. */
export const listForProduct = async (productId) => {
  const { rows } = await pool.query(
    `${SELECT} WHERE product_id = $1 ORDER BY position, color_key`,
    [productId],
  );
  return rows;
};

/** All variants across every product (used by the public catalog endpoint). */
export const listAll = async () => {
  const { rows } = await pool.query(
    `${SELECT} ORDER BY product_id, position, color_key`,
  );
  return rows;
};

/** Look up a single (product, color) — returns null if not found. */
export const findByProductColor = async (productId, colorKey) => {
  const { rows } = await pool.query(
    `${SELECT} WHERE product_id = $1 AND color_key = $2 LIMIT 1`,
    [productId, colorKey],
  );
  return rows[0] ?? null;
};

/**
 * Lock a single variant's stock row inside a transaction. Use the resulting
 * .stock to decide whether enough is available, then call decrement() on the
 * same client to update.
 */
export const lockForUpdate = async (client, variantId) => {
  const { rows } = await client.query(
    `SELECT id, stock FROM product_variants WHERE id = $1 FOR UPDATE`,
    [variantId],
  );
  return rows[0] ?? null;
};

export const decrement = (client, variantId, qty) =>
  client.query(
    `UPDATE product_variants SET stock = stock - $2 WHERE id = $1`,
    [variantId, qty],
  );

/** Replace the entire variants list for a product. Diffs by color_key so
 *  existing rows keep their stock (and image_urls if not provided). */
export const replaceAll = async (productId, variants) => {
  const existing = await listForProduct(productId);
  const existingByKey = Object.fromEntries(existing.map((v) => [v.color_key, v]));
  const incomingKeys = new Set(variants.map((v) => v.colorKey));

  // Delete variants the admin removed.
  for (const ex of existing) {
    if (!incomingKeys.has(ex.color_key)) {
      await pool.query(`DELETE FROM product_variants WHERE id = $1`, [ex.id]);
    }
  }

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const existing = existingByKey[v.colorKey];
    if (existing) {
      await pool.query(
        `UPDATE product_variants
            SET color_label = $2,
                color_hex   = $3,
                stock       = COALESCE($4, stock),
                image_urls  = COALESCE($5, image_urls),
                position    = $6
          WHERE id = $1`,
        [
          existing.id,
          v.colorLabel,
          v.colorHex,
          v.stock != null ? v.stock : null,
          v.imageUrls != null ? v.imageUrls : null,
          i,
        ],
      );
    } else {
      await pool.query(
        `INSERT INTO product_variants
           (product_id, color_key, color_label, color_hex, stock, image_urls, position)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          productId,
          v.colorKey,
          v.colorLabel,
          v.colorHex,
          v.stock ?? 0,
          v.imageUrls ?? [],
          i,
        ],
      );
    }
  }
};

/** Admin-targeted stock update for a single variant. */
export const setStock = async (variantId, stock) => {
  const { rows } = await pool.query(
    `UPDATE product_variants SET stock = $2 WHERE id = $1
       RETURNING id, product_id, color_key, color_label, stock`,
    [variantId, stock],
  );
  return rows[0] ?? null;
};

export const toPublic = (v) => ({
  id: v.id,
  productId: v.product_id,
  colorKey: v.color_key,
  colorLabel: v.color_label,
  colorHex: v.color_hex,
  stock: v.stock,
  imageUrls: v.image_urls ?? [],
  position: v.position,
});
