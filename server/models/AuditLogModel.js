// Append-only audit log. Never updated, never deleted (rotate via a
// scheduled job if storage becomes an issue).

import { query } from "../database/pool.js";

export const insert = async ({ userId, action, ip, userAgent, metadata }) => {
  const { rows } = await query(
    `INSERT INTO audit_logs (user_id, action, ip_address, user_agent, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, created_at`,
    [
      userId ?? null,
      action,
      ip ?? null,
      userAgent ?? null,
      JSON.stringify(metadata ?? {}),
    ],
  );
  return rows[0];
};

export const listForUser = async (userId, { limit = 100, offset = 0 } = {}) => {
  const { rows } = await query(
    `SELECT id, action, ip_address, user_agent, metadata, created_at
       FROM audit_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
  return rows;
};
