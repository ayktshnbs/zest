// Verify the access-token cookie and attach the user to the request.
// On success: req.user = { id, email, role }.
// On failure: throws UnauthorizedError, which the error handler turns
// into a 401 response.

import { verifyAccessToken } from "../services/jwtService.js";
import { ACCESS_COOKIE } from "../utils/cookies.js";
import { UnauthorizedError } from "../utils/errors.js";
import * as UserModel from "../models/UserModel.js";
import * as SessionModel from "../models/SessionModel.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) throw new UnauthorizedError();

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new UnauthorizedError("Invalid or expired session");
  }

  // Revocation check. Access tokens are stateless JWTs, so without this a
  // revoked session (logout, password reset, password change, Google account
  // takeover) stayed usable for the remainder of the 15-minute TTL.
  // Tokens issued before the `sid` claim existed simply skip the check and
  // age out on their own — no forced logout on deploy.
  if (payload.sid) {
    const active = await SessionModel.isActive(payload.sid);
    if (!active) throw new UnauthorizedError("Session has been revoked");
  }

  const user = await UserModel.findById(payload.sub);
  if (!user) throw new UnauthorizedError("Account no longer exists");

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    // Needed by logout: the refresh cookie is path-scoped to
    // /api/auth/refresh, so it is NOT sent on POST /api/auth/logout and the
    // session can only be identified from this claim.
    sessionId: payload.sid ?? null,
  };
  next();
});

/**
 * Role gate. Use after requireAuth.
 *
 *   router.get('/admin', requireAuth, requireRole('admin'), handler);
 */
export const requireRole = (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) {
      const err = new UnauthorizedError("Insufficient permissions");
      err.status = 403;
      err.code = "forbidden";
      return next(err);
    }
    next();
  };
