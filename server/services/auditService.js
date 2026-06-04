// Thin wrapper around the audit_logs table. Failures are logged but never
// throw — auditing must not break the user-facing request.

import * as AuditLogModel from "../models/AuditLogModel.js";
import { logger } from "../utils/logger.js";

export const recordAuditEvent = async ({ userId, action, ip, userAgent, metadata }) => {
  try {
    await AuditLogModel.insert({ userId, action, ip, userAgent, metadata });
  } catch (err) {
    logger.error({ err, action, userId }, "Failed to write audit log");
  }
};
