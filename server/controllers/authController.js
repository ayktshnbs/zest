// Auth controllers — thin orchestration over services/authService.js.

import { asyncHandler } from "../utils/asyncHandler.js";
import * as authService from "../services/authService.js";
import { clearAuthCookies } from "../utils/cookies.js";
import { generateCsrfToken } from "../middleware/csrf.js";

export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req, res, req.validated.body);
  res.status(201).json({ user });
});

export const login = asyncHandler(async (req, res) => {
  const user = await authService.loginUser(req, res, req.validated.body);
  res.json({ user });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req);
  clearAuthCookies(res);
  res.json({ ok: true });
});

export const refresh = asyncHandler(async (req, res) => {
  const user = await authService.refreshSession(req, res);
  res.json({ user });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.requestPasswordReset(req, req.validated.body);
  // Generic response — do not reveal whether the email exists.
  res.json({
    ok: true,
    message: "If that email exists, a reset link has been sent.",
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req, req.validated.body);
  res.json({ ok: true });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await authService.verifyEmail(req, req.validated.body);
  res.json({ user });
});

export const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendEmailVerification(req);
  res.json({ ok: true });
});

export const googleSignIn = asyncHandler(async (req, res) => {
  const { user, isNew } = await authService.signInWithGoogle(req, res, {
    idToken: req.validated.body.id_token,
  });
  res.status(isNew ? 201 : 200).json({ user, isNew });
});

/**
 * Returns the current CSRF token AND sets the `csrf` cookie if missing.
 * The frontend hits this once at app boot, then echoes the token in
 * `x-csrf-token` on subsequent mutating requests.
 */
export const csrf = asyncHandler(async (req, res) => {
  const token = generateCsrfToken(req, res);
  res.json({ csrfToken: token });
});
