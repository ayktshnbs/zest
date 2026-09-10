// User profile management.

import { asyncHandler } from "../utils/asyncHandler.js";
import * as UserModel from "../models/UserModel.js";
import * as authService from "../services/authService.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";
import { audit } from "../middleware/audit.js";

export const me = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user.id);
  if (!user) throw new NotFoundError("Account not found");
  res.json({ user: UserModel.toPublic(user) });
});

export const updateMe = asyncHandler(async (req, res) => {
  const { name, email } = req.validated.body;

  if (email && email !== req.user.email) {
    const existing = await UserModel.findByEmail(email);
    if (existing && existing.id !== req.user.id) {
      throw new ConflictError("Email already in use");
    }
  }

  const updated = await UserModel.updateProfile(req.user.id, { name, email });
  if (!updated) throw new NotFoundError("Account not found");

  await audit(req, "user.profile_updated", {
    changes: { name: Boolean(name), email: Boolean(email) },
  });

  res.json({ user: UserModel.toPublic(updated) });
});

export const changePassword = asyncHandler(async (req, res) => {
  // `res` is passed so the service can re-issue this device's session cookies
  // after revoking every session (see authService.changePassword).
  await authService.changePassword(req, res, req.validated.body);
  res.json({ ok: true });
});
