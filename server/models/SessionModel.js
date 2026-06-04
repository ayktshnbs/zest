// Sessions store refresh tokens (hashed) so we can revoke them server-side.
// The raw refresh token only ever lives in the user's httpOnly cookie.

import { query } from "../database/pool.js";

export const create = async ({ userId, refreshTokenHash, expiresAt, userAgent, ip }) => {
  const { rows } = await query(
    `INSERT INTO sessions (user_id, refresh_token_hash, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, expires_at, created_at`,
    [userId, refreshTokenHash, expiresAt, userAgent ?? null, ip ?? null],
  );
  return rows[0];
};

export const findActiveByHash = async (refreshTokenHash) => {
  const { rows } = await query(
    `SELECT id, user_id, refresh_token_hash, expires_at, revoked_at, last_used_at, created_at
       FROM sessions
      WHERE refresh_token_hash = $1
        AND revoked_at IS NULL
        AND expires_at > NOW()
      LIMIT 1`,
    [refreshTokenHash],
  );
  return rows[0] ?? null;
};

export const touch = async (id) => {
  await query(`UPDATE sessions SET last_used_at = NOW() WHERE id = $1`, [id]);
};

export const revoke = async (id) => {
  await query(`UPDATE sessions SET revoked_at = NOW() WHERE id = $1`, [id]);
};

export const revokeAllForUser = async (userId) => {
  await query(
    `UPDATE sessions SET revoked_at = NOW()
      WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId],
  );
};

export const purgeExpired = async () => {
  const { rowCount } = await query(
    `DELETE FROM sessions WHERE expires_at < NOW() - INTERVAL '30 days'`,
  );
  return rowCount;
};
