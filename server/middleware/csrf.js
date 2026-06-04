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

import { doubleCsrf } from "csrf-csrf";
import { config } from "../config.js";

const {
  generateCsrfToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => config.csrfSecret,
  getSessionIdentifier: (req) => req.cookies?.access_token ?? req.ip ?? "anon",
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
