// CSRF protection (double-submit cookie pattern, via csrf-csrf).
//
// Flow:
//   1. Client hits GET /api/auth/csrf at app boot.
//   2. Server sets a non-httpOnly cookie `csrf` containing the token.
//   3. Client reads that cookie and echoes it as `x-csrf-token` header
//      for every state-changing request.
//   4. csrfProtection verifies header == cookie.
//
// Webhook routes are mounted before this middleware so they bypass it.
// GET / HEAD / OPTIONS requests are also implicitly ignored.

import crypto from "node:crypto";
import { doubleCsrf } from "csrf-csrf";
import { config } from "../config.js";

// Stable, per-browser id the CSRF token is bound to. Kept SEPARATE from the
// auth (access_token) cookie so the token survives access-token rotation —
// otherwise it would silently break ~every 15 min and mutating requests would
// 403. httpOnly: the server reads it; client JS never needs it.
const CSRF_SID_COOKIE = "csrf_sid";

export const ensureCsrfSession = (req, res, next) => {
  if (!req.cookies?.[CSRF_SID_COOKIE]) {
    const sid = crypto.randomBytes(32).toString("hex");
    req.cookies = req.cookies || {};
    req.cookies[CSRF_SID_COOKIE] = sid; // visible to getSessionIdentifier this request
    res.cookie(CSRF_SID_COOKIE, sid, {
      httpOnly: true,
      secure: config.cookies.secure,
      sameSite: "lax",
      domain: config.cookies.domain,
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
    });
  }
  next();
};

const {
  generateCsrfToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => config.csrfSecret,
  getSessionIdentifier: (req) => req.cookies?.[CSRF_SID_COOKIE] ?? req.ip ?? "anon",
  cookieName: "csrf",
  cookieOptions: {
    httpOnly: false, // intentional: client JS must read this
    secure: config.cookies.secure,
    sameSite: "lax",
    domain: config.cookies.domain,
    path: "/",
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getCsrfTokenFromRequest: (req) =>
    req.headers["x-csrf-token"] || req.body?._csrf,
});

export { generateCsrfToken, doubleCsrfProtection };
