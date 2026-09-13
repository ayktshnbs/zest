// Saved delivery addresses ("Adreslerim"). See migrations/023_create_addresses.sql
// for why this table has no relationship to orders: orders.shipping_address
// is an independent JSONB snapshot, so nothing here can ever retroactively
// change a past order.
//
// Every function that touches a specific row takes `userId` and filters on it
// in the SQL itself — never "fetch by id, then check ownership in JS". That
// way a typo can't turn into an IDOR: the query simply returns no row for
// another user's address id, which every caller already treats as not-found.

import { query, withTransaction } from "../database/pool.js";

const COLUMNS = `
  id, user_id, title, full_name, phone, line1, line2,
  city, state, postal_code, country, is_default, created_at, updated_at
`;

export const listForUser = async (userId) => {
  const { rows } = await query(
    `SELECT ${COLUMNS} FROM addresses
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at DESC`,
    [userId],
  );
  return rows;
};

/** Ownership-scoped lookup — returns null for a wrong-user id, same as a missing one. */
export const getForUser = async (id, userId) => {
  const { rows } = await query(
    `SELECT ${COLUMNS} FROM addresses WHERE id = $1 AND user_id = $2 LIMIT 1`,
    [id, userId],
  );
  return rows[0] ?? null;
};

export const countForUser = async (userId) => {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS n FROM addresses WHERE user_id = $1`,
    [userId],
  );
  return rows[0].n;
};

/**
 * Insert a new address. If `isDefault` is true, unsets any existing default
 * first, in the same transaction — the partial unique index
 * (addresses_one_default_per_user) makes the alternative (insert first, then
 * unset) impossible to do safely, since the insert itself would briefly
 * violate the constraint.
 */
export const create = async (
  userId,
  { title, fullName, phone, line1, line2, city, state, postalCode, isDefault },
) => {
  return withTransaction(async (client) => {
    if (isDefault) {
      await client.query(
        `UPDATE addresses SET is_default = FALSE WHERE user_id = $1 AND is_default = TRUE`,
        [userId],
      );
    }
    const { rows } = await client.query(
      `INSERT INTO addresses
         (user_id, title, full_name, phone, line1, line2, city, state, postal_code, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING ${COLUMNS}`,
      [
        userId,
        title,
        fullName,
        phone,
        line1,
        line2 ?? null,
        city,
        state,
        postalCode,
        Boolean(isDefault),
      ],
    );
    return rows[0];
  });
};

/**
 * Partial update, ownership-scoped. Returns null if the row doesn't exist or
 * isn't owned by `userId` — the caller can't distinguish those two cases,
 * which is exactly the point (never confirm another user's address exists).
 *
 * Setting isDefault: true unsets the previous default in the same
 * transaction; isDefault: false just clears this row's own flag (a user can
 * always un-default their own address without naming a replacement).
 */
export const updateForUser = async (
  id,
  userId,
  { title, fullName, phone, line1, line2, city, state, postalCode, isDefault },
) => {
  return withTransaction(async (client) => {
    const { rows: owned } = await client.query(
      `SELECT id FROM addresses WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    if (owned.length === 0) return null;

    if (isDefault === true) {
      await client.query(
        `UPDATE addresses SET is_default = FALSE WHERE user_id = $1 AND is_default = TRUE AND id != $2`,
        [userId, id],
      );
    }

    const sets = [];
    const params = [id, userId];
    const add = (col, value) => {
      params.push(value);
      sets.push(`${col} = $${params.length}`);
    };
    if (title !== undefined) add("title", title);
    if (fullName !== undefined) add("full_name", fullName);
    if (phone !== undefined) add("phone", phone);
    if (line1 !== undefined) add("line1", line1);
    if (line2 !== undefined) add("line2", line2);
    if (city !== undefined) add("city", city);
    if (state !== undefined) add("state", state);
    if (postalCode !== undefined) add("postal_code", postalCode);
    if (isDefault !== undefined) add("is_default", isDefault);

    if (sets.length === 0) {
      // Nothing to change (shouldn't happen — the route schema requires at
      // least one field) — return the current row rather than no-op UPDATE.
      const { rows } = await client.query(
        `SELECT ${COLUMNS} FROM addresses WHERE id = $1 AND user_id = $2`,
        [id, userId],
      );
      return rows[0] ?? null;
    }

    const { rows } = await client.query(
      `UPDATE addresses SET ${sets.join(", ")}
        WHERE id = $1 AND user_id = $2
       RETURNING ${COLUMNS}`,
      params,
    );
    return rows[0] ?? null;
  });
};

/**
 * Delete, ownership-scoped. If the deleted row was the default and the user
 * has other addresses left, promotes the most recently created remaining one
 * to default — so "no default at all" only ever happens when the user has no
 * addresses left, never as a side effect of deleting one among several.
 *
 * Returns false if the row didn't exist / wasn't owned (nothing to delete).
 */
export const removeForUser = async (id, userId) => {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING is_default`,
      [id, userId],
    );
    if (rows.length === 0) return false;

    if (rows[0].is_default) {
      await client.query(
        `UPDATE addresses SET is_default = TRUE
          WHERE id = (
            SELECT id FROM addresses
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT 1
          )`,
        [userId],
      );
    }
    return true;
  });
};

export const toPublic = (a) => ({
  id: a.id,
  title: a.title,
  fullName: a.full_name,
  phone: a.phone,
  line1: a.line1,
  line2: a.line2,
  city: a.city,
  state: a.state,
  postalCode: a.postal_code,
  country: a.country,
  isDefault: a.is_default,
  createdAt: a.created_at,
  updatedAt: a.updated_at,
});
