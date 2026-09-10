// Thin wrapper around the audit_logs table. Failures are logged but never
// throw — auditing must not break the user-facing request.

import * as AuditLogModel from "../models/AuditLogModel.js";
import { logger } from "../utils/logger.js";

/**
 * @param {object} event
 * @param {import("pg").PoolClient} [db]  transaction client. Pass one when the
 *   audit entry describes work being done in that transaction, so the two
 *   commit or roll back together. Omit it (default pool) for entries that must
 *   survive a rollback — e.g. recording that processing itself failed.
 */
export const recordAuditEvent = async ({ userId, action, ip, userAgent, metadata }, db) => {
  try {
    await AuditLogModel.insert({ userId, action, ip, userAgent, metadata }, db);
  } catch (err) {
    logger.error({ err, action, userId }, "Failed to write audit log");
  }
};
