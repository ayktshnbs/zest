// Admin-managed categories (separate from the built-in code categories in
// lib/categories.ts). See migrations/015_create_custom_catalog.sql.

import { pool } from "../database/pool.js";

export const listAll = async () => {
  const { rows } = await pool.query(
    `SELECT slug, label, image_url, display_order, created_at, updated_at
       FROM categories
      ORDER BY display_order, label`,
  );
  return rows;
};

export const get = async (slug) => {
  const { rows } = await pool.query(
    `SELECT slug, label, image_url, display_order, created_at, updated_at
       FROM categories WHERE slug = $1`,
    [slug],
  );
  return rows[0] ?? null;
};

export const create = async ({ slug, label, imageUrl, displayOrder }) => {
  const { rows } = await pool.query(
    `INSERT INTO categories (slug, label, image_url, display_order)
     VALUES ($1, $2, $3, $4)
     RETURNING slug, label, image_url, display_order, created_at, updated_at`,
    [slug, label, imageUrl ?? null, displayOrder ?? 0],
  );
  return rows[0];
};

export const update = async (slug, { label, imageUrl, displayOrder }) => {
  const sets = [];
  const params = [slug];
  if (label !== undefined) {
    params.push(label);
    sets.push(`label = $${params.length}`);
  }
  if (imageUrl !== undefined) {
    params.push(imageUrl);
    sets.push(`image_url = $${params.length}`);
  }
  if (displayOrder !== undefined) {
    params.push(displayOrder);
    sets.push(`display_order = $${params.length}`);
  }
  if (sets.length === 0) return get(slug);
  const { rows } = await pool.query(
    `UPDATE categories SET ${sets.join(", ")} WHERE slug = $1
     RETURNING slug, label, image_url, display_order, created_at, updated_at`,
    params,
  );
  return rows[0] ?? null;
};

/** Delete a category only if no custom products reference it. */
export const remove = async (slug) => {
  const { rows: refs } = await pool.query(
    `SELECT COUNT(*)::int n FROM custom_products WHERE category_slug = $1`,
    [slug],
  );
  if (refs[0].n > 0) {
    const err = new Error("Category has products");
    err.code = "category_not_empty";
    err.count = refs[0].n;
    throw err;
  }
  const { rowCount } = await pool.query(`DELETE FROM categories WHERE slug = $1`, [slug]);
  return rowCount > 0;
};

export const toPublic = (c) => ({
  slug: c.slug,
  label: c.label,
  imageUrl: c.image_url,
  displayOrder: c.display_order,
});
