// Verify the access-token cookie and attach the user to the request.
// On success: req.user = { id, email, role }.
// On failure: throws UnauthorizedError, which the error handler turns
// into a 401 response.

import { verifyAccessToken } from "../services/jwtService.js";
import { ACCESS_COOKIE } from "../utils/cookies.js";
import { UnauthorizedError } from "../utils/errors.js";
import * as UserModel from "../models/UserModel.js";
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

  const user = await UserModel.findById(payload.sub);
  if (!user) throw new UnauthorizedError("Account no longer exists");

  req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
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
