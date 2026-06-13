// All auth orchestration lives here. Controllers stay thin — they parse
// the request and delegate everything (token minting, hashing, DB updates,
// email sending, audit logging) to this file.

import bcrypt from "bcrypt";
import { config } from "../config.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/errors.js";
import { generateToken, hashToken } from "../utils/tokens.js";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "../utils/cookies.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  parseDurationMs,
} from "./jwtService.js";
import * as UserModel from "../models/UserModel.js";
import * as SessionModel from "../models/SessionModel.js";
import * as PasswordResetTokenModel from "../models/PasswordResetTokenModel.js";
import * as EmailVerificationTokenModel from "../models/EmailVerificationTokenModel.js";
import { sendPasswordResetEmail, sendWelcomeEmail, sendVerificationEmail } from "./emailService.js";
import { verifyGoogleIdToken } from "./googleAuthService.js";
import { recordAuditEvent } from "./auditService.js";
import { logger } from "../utils/logger.js";

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const accessTtlMs = parseDurationMs(config.jwt.accessTtl);
const refreshTtlMs = parseDurationMs(config.jwt.refreshTtl);

/** Hash a password with bcrypt at the configured cost. */
export const hashPassword = (password) =>
  bcrypt.hash(password, config.bcryptRounds);

/** Constant-time password check. */
export const verifyPassword = (password, hash) => {
  if (!hash) return Promise.resolve(false);
  return bcrypt.compare(password, hash);
};

/**
 * Issue access + refresh tokens and set them as httpOnly cookies.
 * Also records a session row so the refresh token can be revoked.
 */
const issueSession = async (res, user, { ip, userAgent }) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await SessionModel.create({
    userId: user.id,
    refreshTokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + refreshTtlMs),
    userAgent,
    ip,
  });

  res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions(accessTtlMs));
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions(refreshTtlMs));

  return { accessToken, refreshToken };
};

/** Issue a fresh email-verification token and email the link. */
const sendEmailVerification = async (user) => {
  const rawToken = generateToken(32);
  await EmailVerificationTokenModel.create({
    userId: user.id,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
  });
  const verifyUrl = `${config.urls.emailVerification}?token=${encodeURIComponent(rawToken)}`;
  await sendVerificationEmail({ to: user.email, name: user.name, verifyUrl });
};

// ── Registration ─────────────────────────────────────────────────────
export const registerUser = async (req, res, { name, email, password }) => {
  const existing = await UserModel.findByEmail(email);
  if (existing) throw new ConflictError("An account with this email already exists");

  const passwordHash = await hashPassword(password);
  const user = await UserModel.create({ email, name, passwordHash });

  await issueSession(res, user, { ip: req.ip, userAgent: req.headers["user-agent"] });
  await UserModel.touchLastLogin(user.id);

  await recordAuditEvent({
    userId: user.id,
    action: "auth.register",
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  // Best-effort welcome email — never block registration on failure
  sendWelcomeEmail({ to: email, name, loginUrl: config.urls.login }).catch((err) => {
    logger.warn({ err }, "Welcome email failed");
  });

  // Best-effort email-verification link — also never blocks registration.
  sendEmailVerification(user).catch((err) => {
    logger.warn({ err, userId: user.id }, "Verification email failed");
  });

  return UserModel.toPublic(user);
};

// ── Login ───────────────────────────────────────────────────────────
export const loginUser = async (req, res, { email, password }) => {
  const user = await UserModel.findByEmail(email);
  // Constant work either way — never reveal whether the email exists
  const ok = user
    ? await verifyPassword(password, user.password_hash)
    : await verifyPassword(password, "$2b$12$invalidsaltinvalidsaltinvalidsalt.");

  if (!user || !ok) {
    await recordAuditEvent({
      userId: user?.id ?? null,
      action: "auth.login.failed",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      metadata: { email },
    });
    throw new UnauthorizedError("Invalid email or password");
  }

  await issueSession(res, user, { ip: req.ip, userAgent: req.headers["user-agent"] });
  await UserModel.touchLastLogin(user.id);

  await recordAuditEvent({
    userId: user.id,
    action: "auth.login.success",
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  return UserModel.toPublic(user);
};

// ── Logout ──────────────────────────────────────────────────────────
export const logoutUser = async (req) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  if (refreshToken) {
    const session = await SessionModel.findActiveByHash(hashToken(refreshToken));
    if (session) await SessionModel.revoke(session.id);
  }

  await recordAuditEvent({
    userId: req.user?.id ?? null,
    action: "auth.logout",
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
};

// ── Refresh ─────────────────────────────────────────────────────────
export const refreshSession = async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw new UnauthorizedError("No refresh token");

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new UnauthorizedError("Invalid refresh token");
  }

  const session = await SessionModel.findActiveByHash(hashToken(token));
  if (!session) throw new UnauthorizedError("Session expired");

  const user = await UserModel.findById(payload.sub);
  if (!user) throw new UnauthorizedError();

  // Rotate: revoke old session, issue a fresh pair
  await SessionModel.revoke(session.id);
  await issueSession(res, user, { ip: req.ip, userAgent: req.headers["user-agent"] });

  return UserModel.toPublic(user);
};

// ── Forgot password ─────────────────────────────────────────────────
export const requestPasswordReset = async (req, { email }) => {
  const user = await UserModel.findByEmail(email);

  // Always audit the attempt, but NEVER reveal whether the email exists.
  // The controller returns a generic message regardless.
  await recordAuditEvent({
    userId: user?.id ?? null,
    action: "auth.forgot_password",
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    metadata: { email },
  });

  if (!user) return;

  const rawToken = generateToken(32);
  const tokenHash = hashToken(rawToken);
  await PasswordResetTokenModel.create({
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
  });

  const resetUrl = `${config.urls.passwordReset}?token=${encodeURIComponent(rawToken)}`;

  try {
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
  } catch (err) {
    logger.error({ err, userId: user.id }, "Password reset email failed");
    // Don't leak through HTTP — the controller still returns 200
  }
};

// ── Reset password ──────────────────────────────────────────────────
export const resetPassword = async (req, { token, password }) => {
  const tokenHash = hashToken(token);
  const record = await PasswordResetTokenModel.findActiveByHash(tokenHash);
  if (!record) throw new UnauthorizedError("Invalid or expired reset token");

  const passwordHash = await hashPassword(password);
  await UserModel.updatePasswordHash(record.user_id, passwordHash);
  await PasswordResetTokenModel.markUsed(record.id);
  // Invalidate other outstanding tokens AND existing sessions —
  // a password reset implies "log everyone out".
  await PasswordResetTokenModel.invalidateForUser(record.user_id);
  await SessionModel.revokeAllForUser(record.user_id);

  await recordAuditEvent({
    userId: record.user_id,
    action: "auth.password_reset",
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
};

// ── Change password (while logged in) ───────────────────────────────
export const changePassword = async (req, { currentPassword, newPassword }) => {
  const user = await UserModel.findById(req.user.id);
  if (!user) throw new NotFoundError("Account not found");

  const ok = await verifyPassword(currentPassword, user.password_hash);
  if (!ok) throw new UnauthorizedError("Current password is incorrect");

  const passwordHash = await hashPassword(newPassword);
  await UserModel.updatePasswordHash(user.id, passwordHash);

  // Revoke all other sessions; keep the current one alive by re-issuing.
  await SessionModel.revokeAllForUser(user.id);

  await recordAuditEvent({
    userId: user.id,
    action: "auth.password_changed",
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
};

// ── Verify email ────────────────────────────────────────────────────
export const verifyEmail = async (req, { token }) => {
  const tokenHash = hashToken(token);
  const record = await EmailVerificationTokenModel.findActiveByHash(tokenHash);
  if (!record) throw new UnauthorizedError("Invalid or expired verification link");

  const user = await UserModel.markEmailVerified(record.user_id);
  await EmailVerificationTokenModel.markUsed(record.id);
  await EmailVerificationTokenModel.invalidateForUser(record.user_id);

  await recordAuditEvent({
    userId: record.user_id,
    action: "auth.email_verified",
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  return UserModel.toPublic(user);
};

// ── Resend verification ─────────────────────────────────────────────
export const resendEmailVerification = async (req) => {
  const user = await UserModel.findById(req.user.id);
  if (!user) throw new NotFoundError("Account not found");
  if (user.email_verified) return; // already verified — nothing to do

  await EmailVerificationTokenModel.invalidateForUser(user.id);
  await sendEmailVerification(user);

  await recordAuditEvent({
    userId: user.id,
    action: "auth.email_verification_resent",
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
};

// ── Google Sign-In ──────────────────────────────────────────────────
export const signInWithGoogle = async (req, res, { idToken }) => {
  const google = await verifyGoogleIdToken(idToken);

  // 1) Existing user matched by google_sub → straight in
  let user = await UserModel.findByGoogleSub(google.sub);

  // 2) No google_sub match — look up by email and link
  if (!user) {
    const byEmail = await UserModel.findByEmail(google.email);
    if (byEmail) {
      // SEC-4: an existing account whose email was never verified may be an
      // attacker's pre-registered (pre-hijack) account. Google has now proven
      // the email belongs to this person, so take full control — drop any
      // password set before verification and revoke its existing sessions.
      const clearedPreHijackPassword =
        !byEmail.email_verified && Boolean(byEmail.password_hash);
      user = await UserModel.linkGoogleAccount(byEmail.id, google.sub);
      if (clearedPreHijackPassword) {
        await UserModel.clearPassword(byEmail.id);
        await SessionModel.revokeAllForUser(byEmail.id);
      }
      await recordAuditEvent({
        userId: user.id,
        action: "auth.google.linked",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        metadata: clearedPreHijackPassword
          ? { clearedPreHijackPassword: true }
          : undefined,
      });
    }
  }

  // 3) Brand new account
  let isNew = false;
  if (!user) {
    user = await UserModel.create({
      email: google.email,
      name: google.name,
      googleSub: google.sub,
      emailVerified: google.emailVerified,
    });
    isNew = true;
  }

  await issueSession(res, user, { ip: req.ip, userAgent: req.headers["user-agent"] });
  await UserModel.touchLastLogin(user.id);

  await recordAuditEvent({
    userId: user.id,
    action: isNew ? "auth.google.signup" : "auth.google.login",
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  if (isNew) {
    sendWelcomeEmail({
      to: user.email,
      name: user.name,
      loginUrl: config.urls.login,
    }).catch((err) => logger.warn({ err }, "Welcome email failed"));
  }

  return { user: UserModel.toPublic(user), isNew };
};
