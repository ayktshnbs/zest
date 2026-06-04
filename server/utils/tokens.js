// Crypto-safe random tokens and one-way hashing helpers.

import crypto from "node:crypto";

/**
 * Generate a URL-safe random token suitable for emails / refresh sessions.
 * 32 bytes of entropy → 43 chars of base64url. Strong against brute force.
 */
export const generateToken = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("base64url");

/**
 * One-way hash for token storage. We hash the raw token before saving so a
 * database leak does not expose live credentials. SHA-256 is fine here —
 * tokens are high-entropy random, no need for bcrypt's slowness.
 */
export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");
