// Email verification tokens. Only hashes are stored; the raw token is emailed
// to the user once and never persisted. Mirrors PasswordResetTokenModel.

import { query } from "../database/pool.js";

export const create = async ({ userId, tokenHash, expiresAt }) => {
  const { rows } = await query(
    `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, expires_at, created_at`,
    [userId, tokenHash, expiresAt],
  );
  return rows[0];
};

export const findActiveByHash = async (tokenHash) => {
  const { rows } = await query(
    `SELECT id, user_id, token_hash, expires_at, used_at, created_at
       FROM email_verification_tokens
      WHERE token_hash = $1
        AND used_at IS NULL
        AND expires_at > NOW()
      LIMIT 1`,
    [tokenHash],
  );
  return rows[0] ?? null;
};

export const markUsed = async (id) => {
  await query(`UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1`, [id]);
};

/** Invalidate every outstanding token for a user (e.g. after a successful verify or resend). */
export const invalidateForUser = async (userId) => {
  await query(
    `UPDATE email_verification_tokens
       SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [userId],
  );
};

/** Housekeeping — call from a scheduled job if you want hard deletes. */
export const purgeExpired = async () => {
  const { rowCount } = await query(
    `DELETE FROM email_verification_tokens WHERE expires_at < NOW() - INTERVAL '7 days'`,
  );
  return rowCount;
};
