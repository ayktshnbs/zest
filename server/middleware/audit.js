// Thin helper for controllers to record audit entries. Kept here so the
// middleware folder has a single place to look for cross-cutting concerns.
// The actual write goes through services/auditService.js.

import { recordAuditEvent } from "../services/auditService.js";

/**
 * Record an audit log entry tied to the current request.
 *
 *   await audit(req, 'auth.login.success', { ... });
 */
export const audit = (req, action, metadata = {}) =>
  recordAuditEvent({
    userId: req.user?.id ?? null,
    action,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    metadata,
  });
