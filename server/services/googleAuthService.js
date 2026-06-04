// Google Sign-In with ID-token verification.
//
// Frontend flow:
//   1. User taps Google button on the site, gets a Google ID token client-side.
//   2. Frontend POSTs { id_token } to /api/auth/google.
//   3. This service verifies the token's signature and audience.
//   4. Caller (authService.signInWithGoogle) upserts the user.

import { OAuth2Client } from "google-auth-library";
import { config } from "../config.js";
import { UnauthorizedError } from "../utils/errors.js";

const client = new OAuth2Client(config.google.clientId);

/**
 * Verify a Google ID token and return the parsed payload.
 * Throws UnauthorizedError on any failure (bad signature, wrong audience,
 * expired token, etc.) — callers can simply propagate.
 */
export const verifyGoogleIdToken = async (idToken) => {
  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    });
  } catch {
    throw new UnauthorizedError("Invalid Google credential");
  }

  const payload = ticket.getPayload();
  if (!payload) throw new UnauthorizedError("Invalid Google credential");
  if (!payload.email || !payload.email_verified) {
    throw new UnauthorizedError("Google account has no verified email");
  }
  if (!payload.sub) throw new UnauthorizedError("Invalid Google credential");

  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email.split("@")[0],
    picture: payload.picture,
    emailVerified: Boolean(payload.email_verified),
  };
};
