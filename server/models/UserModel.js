// User table queries. All SQL is parametrized — never interpolate.
// Returns plain objects; passwords are never logged (logger.js redacts).

import { query } from "../database/pool.js";

const PUBLIC_COLUMNS = `
  id, email, name, role, google_sub, email_verified,
  last_login_at, created_at, updated_at
`;

export const findById = async (id) => {
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE id = $1 LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
};

export const findByEmail = async (email) => {
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE email = $1 LIMIT 1`,
    [email],
  );
  return rows[0] ?? null;
};

export const findByGoogleSub = async (googleSub) => {
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE google_sub = $1 LIMIT 1`,
    [googleSub],
  );
  return rows[0] ?? null;
};

export const create = async ({ email, name, passwordHash, googleSub, emailVerified = false }) => {
  const { rows } = await query(
    `INSERT INTO users (email, name, password_hash, google_sub, email_verified)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${PUBLIC_COLUMNS}`,
    [email, name, passwordHash ?? null, googleSub ?? null, emailVerified],
  );
  return rows[0];
};

export const updateProfile = async (id, { name, email }) => {
  const { rows } = await query(
    `UPDATE users
       SET name = COALESCE($2, name),
           email = COALESCE($3, email)
     WHERE id = $1
     RETURNING ${PUBLIC_COLUMNS}`,
    [id, name ?? null, email ?? null],
  );
  return rows[0] ?? null;
};

export const updatePasswordHash = async (id, passwordHash) => {
  const { rows } = await query(
    `UPDATE users SET password_hash = $2 WHERE id = $1
     RETURNING ${PUBLIC_COLUMNS}`,
    [id, passwordHash],
  );
  return rows[0] ?? null;
};

export const linkGoogleAccount = async (id, googleSub) => {
  const { rows } = await query(
    `UPDATE users
       SET google_sub = $2, email_verified = TRUE
     WHERE id = $1
     RETURNING ${PUBLIC_COLUMNS}`,
    [id, googleSub],
  );
  return rows[0] ?? null;
};

export const touchLastLogin = async (id) => {
  await query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [id]);
};

/** Strip non-public fields before returning to clients. */
export const toPublic = (user) => {
  if (!user) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password_hash, ...safe } = user;
  return {
    id: safe.id,
    email: safe.email,
    name: safe.name,
    role: safe.role,
    emailVerified: safe.email_verified,
    hasGoogle: Boolean(safe.google_sub),
    lastLoginAt: safe.last_login_at,
    createdAt: safe.created_at,
    updatedAt: safe.updated_at,
  };
};
