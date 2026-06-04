// JWT helpers — separate secrets for access vs refresh so refresh tokens
// cannot be replayed against access-token verification and vice versa.

import jwt from "jsonwebtoken";
import { config } from "../config.js";

/** Parse durations like "15m", "7d" into milliseconds. Used for cookie maxAge. */
export const parseDurationMs = (s) => {
  if (typeof s === "number") return s;
  const match = /^(\d+)\s*(ms|s|m|h|d)$/.exec(String(s).trim());
  if (!match) throw new Error(`Invalid duration: ${s}`);
  const n = Number(match[1]);
  const unit = match[2];
  const mult = { ms: 1, s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return n * mult;
};

const baseOptions = {
  issuer: "zest-kitchene",
  audience: "zest-kitchene-web",
};

export const signAccessToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      typ: "access",
    },
    config.jwt.accessSecret,
    {
      ...baseOptions,
      expiresIn: config.jwt.accessTtl,
    },
  );

export const signRefreshToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      typ: "refresh",
    },
    config.jwt.refreshSecret,
    {
      ...baseOptions,
      expiresIn: config.jwt.refreshTtl,
    },
  );

export const verifyAccessToken = (token) =>
  jwt.verify(token, config.jwt.accessSecret, baseOptions);

export const verifyRefreshToken = (token) =>
  jwt.verify(token, config.jwt.refreshSecret, baseOptions);
