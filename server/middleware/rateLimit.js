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

// Order creation reserves stock, so it gets a much tighter budget than
// general browsing (default 10 per 15-minute window per IP). Applied ONLY to
// POST /api/orders — reading order history stays on the global limiter.
export const checkoutRateLimiter = rateLimit({
  ...standardOptions,
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.checkoutMax,
  message: {
    error: {
      code: "rate_limited",
      message: "Çok fazla sipariş denemesi yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.",
    },
  },
});
