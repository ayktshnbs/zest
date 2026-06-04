// Rate limiting. Two tiers:
//   * globalRateLimiter   — mounted app-wide; broad protection.
//   * authRateLimiter     — stricter, used on /auth/login, /auth/register,
//                           /auth/forgot-password, /auth/reset-password.
//
// Keys default to the client IP. Behind a proxy, ensure `trust proxy` is
// set on the Express app (already done in app.js).

import rateLimit from "express-rate-limit";
import { config } from "../config.js";

const standardOptions = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: { code: "rate_limited", message: "Too many requests" } },
};

export const globalRateLimiter = rateLimit({
  ...standardOptions,
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
});

export const authRateLimiter = rateLimit({
  ...standardOptions,
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  // Don't count successful auth — only retries / failures eat the budget
  skipSuccessfulRequests: true,
});
