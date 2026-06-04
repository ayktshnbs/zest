// Password reset tokens. Only hashes are stored. The raw token is given
// to the user once via email and never persisted.

import { query } from "../database/pool.js";

export const create = async ({ userId, tokenHash, expiresAt }) => {
  const { rows } = await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, expires_at, created_at`,
    [userId, tokenHash, expiresAt],
  );
  return rows[0];
};

export const findActiveByHash = async (tokenHash) => {
  const { rows } = await query(
    `SELECT id, user_id, token_hash, expires_at, used_at, created_at
       FROM password_reset_tokens
      WHERE token_hash = $1
        AND used_at IS NULL
        AND expires_at > NOW()
      LIMIT 1`,
    [tokenHash],
  );
  return rows[0] ?? null;
};

export const markUsed = async (id) => {
  await query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`, [id]);
};

/** Invalidate every outstanding token for a user (e.g. after a successful reset). */
export const invalidateForUser = async (userId) => {
  await query(
    `UPDATE password_reset_tokens
       SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [userId],
  );
};

/** Housekeeping — call from a scheduled job if you want hard deletes. */
export const purgeExpired = async () => {
  const { rowCount } = await query(
    `DELETE FROM password_reset_tokens WHERE expires_at < NOW() - INTERVAL '7 days'`,
  );
  return rowCount;
};
