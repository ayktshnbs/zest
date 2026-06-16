// Custom (admin-added) products. The built-in 46 still live in lib/products.ts;
// this table holds everything an admin creates at runtime. See migration 015.

import { pool } from "../database/pool.js";

const SELECT = `
  SELECT id, name, category_slug, price_cents, short_description, description,
         image_urls, badges, is_active, created_at, updated_at
    FROM custom_products
`;

export const listAll = async ({ activeOnly = false } = {}) => {
  const where = activeOnly ? "WHERE is_active = TRUE" : "";
  const { rows } = await pool.query(
    `${SELECT} ${where} ORDER BY created_at DESC`,
  );
  return rows;
};

export const get = async (id) => {
  const { rows } = await pool.query(`${SELECT} WHERE id = $1`, [id]);
  return rows[0] ?? null;
};

export const create = async ({
  id,
  name,
  categorySlug,
  priceCents,
  shortDescription,
  description,
  imageUrls,
  badges,
  isActive,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO custom_products
       (id, name, category_slug, price_cents, short_description, description,
        image_urls, badges, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      id,
      name,
      categorySlug,
      priceCents,
      shortDescription ?? null,
      description ?? null,
      imageUrls ?? [],
      JSON.stringify(badges ?? {}),
      isActive ?? true,
    ],
  );
  return rows[0];
};

export const update = async (id, fields) => {
  const map = {
    name: "name",
    categorySlug: "category_slug",
    priceCents: "price_cents",
    shortDescription: "short_description",
    description: "description",
    imageUrls: "image_urls",
    badges: "badges",
    isActive: "is_active",
  };
  const sets = [];
  const params = [id];
  for (const [k, col] of Object.entries(map)) {
    if (!(k in fields)) continue;
    let v = fields[k];
    if (k === "badges" && v != null) v = JSON.stringify(v);
    params.push(v);
    sets.push(`${col} = $${params.length}`);
  }
  if (sets.length === 0) return get(id);
  const { rows } = await pool.query(
    `UPDATE custom_products SET ${sets.join(", ")} WHERE id = $1 RETURNING *`,
    params,
  );
  return rows[0] ?? null;
};

export const remove = async (id) => {
  const { rowCount } = await pool.query(`DELETE FROM custom_products WHERE id = $1`, [id]);
  return rowCount > 0;
};

export const toPublic = (p) => ({
  id: p.id,
  name: p.name,
  categorySlug: p.category_slug,
  priceCents: Number(p.price_cents),
  shortDescription: p.short_description,
  description: p.description,
  imageUrls: p.image_urls ?? [],
  badges: p.badges ?? {},
  isActive: p.is_active,
  createdAt: p.created_at,
  updatedAt: p.updated_at,
});
