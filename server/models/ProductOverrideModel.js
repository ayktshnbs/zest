// Admin-editable per-product overrides (name, price, descriptions). NULL field
// = use the code/catalog default. See migrations/014_create_product_overrides
// + 016_add_description_overrides.

import { pool } from "../database/pool.js";

const SELECT_COLS = `product_id, name, price_cents, short_description, description, is_active, image_urls, volume_label, set_size, badges`;

/** { productId: { name, priceCents, shortDescription, description, isActive, imageUrls } }
 *  for every product with an override row. NULL fields stay null (caller falls
 *  back to the static catalog). isActive defaults to true. */
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
      isActive: r.is_active,
      imageUrls: r.image_urls,
      volumeLabel: r.volume_label,
      setSize: r.set_size,
      badges: r.badges,
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

/** Retired built-in product ids (is_active = false). */
export const getInactiveIds = async () => {
  const { rows } = await pool.query(
    `SELECT product_id FROM product_overrides WHERE is_active = FALSE`,
  );
  return rows.map((r) => r.product_id);
};

/**
 * Upsert override fields. Only keys PRESENT in `fields` are changed; a present
 * value of null clears that field back to the catalog default. `isActive`
 * controls whether the storefront shows the product at all (used to retire
 * built-in products that have been replaced by new variant products).
 */
export const set = async (productId, fields) => {
  const cur =
    (await get(productId)) ?? {
      name: null,
      price_cents: null,
      short_description: null,
      description: null,
      is_active: true,
      image_urls: null,
      volume_label: null,
      set_size: null,
      badges: null,
    };
  const name = "name" in fields ? fields.name : cur.name;
  const priceCents = "priceCents" in fields ? fields.priceCents : cur.price_cents;
  const shortDescription =
    "shortDescription" in fields ? fields.shortDescription : cur.short_description;
  const description = "description" in fields ? fields.description : cur.description;
  const isActive = "isActive" in fields ? fields.isActive : cur.is_active;
  // null OR empty array both clear the override → static catalog images win.
  const imageUrls =
    "imageUrls" in fields
      ? fields.imageUrls && fields.imageUrls.length > 0
        ? fields.imageUrls
        : null
      : cur.image_urls;
  const volumeLabel =
    "volumeLabel" in fields
      ? fields.volumeLabel && fields.volumeLabel.trim() !== ""
        ? fields.volumeLabel
        : null
      : cur.volume_label;
  const setSize =
    "setSize" in fields
      ? fields.setSize == null || fields.setSize === ""
        ? null
        : Number(fields.setSize)
      : cur.set_size;
  // badges is JSONB — accept an object, send as JSON string. Empty object
  // collapses to null so the catalog default badges win.
  const badgesRaw = "badges" in fields ? fields.badges : cur.badges;
  const hasBadgeKeys =
    badgesRaw && typeof badgesRaw === "object" && Object.keys(badgesRaw).length > 0;
  const badges = hasBadgeKeys ? JSON.stringify(badgesRaw) : null;
  const { rows } = await pool.query(
    `INSERT INTO product_overrides
       (product_id, name, price_cents, short_description, description, is_active,
        image_urls, volume_label, set_size, badges)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (product_id) DO UPDATE
       SET name = EXCLUDED.name,
           price_cents = EXCLUDED.price_cents,
           short_description = EXCLUDED.short_description,
           description = EXCLUDED.description,
           is_active = EXCLUDED.is_active,
           image_urls = EXCLUDED.image_urls,
           volume_label = EXCLUDED.volume_label,
           set_size = EXCLUDED.set_size,
           badges = EXCLUDED.badges
     RETURNING ${SELECT_COLS}`,
    [
      productId, name, priceCents, shortDescription, description, isActive,
      imageUrls, volumeLabel, setSize, badges,
    ],
  );
  return rows[0];
};
