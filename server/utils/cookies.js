// Centralised cookie settings so all auth cookies share consistent flags.

import { config } from "../config.js";

const baseOptions = () => ({
  httpOnly: true,
  secure: config.cookies.secure,
  sameSite: "lax",
  domain: config.cookies.domain,
  path: "/",
});

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

export const accessCookieOptions = (maxAgeMs) => ({
  ...baseOptions(),
  maxAge: maxAgeMs,
});

export const refreshCookieOptions = (maxAgeMs) => ({
  ...baseOptions(),
  // Scope refresh cookie to the refresh endpoint only — it never needs to
  // be sent on other requests, so don't expose it there.
  path: "/api/auth/refresh",
  maxAge: maxAgeMs,
});

export const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE, { ...baseOptions(), maxAge: 0 });
  res.clearCookie(REFRESH_COOKIE, {
    ...baseOptions(),
    path: "/api/auth/refresh",
    maxAge: 0,
  });
};
