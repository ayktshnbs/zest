// /api/auth/*

import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/rateLimit.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleSignInSchema,
} from "../utils/validation.js";

const router = Router();

router.get("/csrf", authController.csrf);

router.post(
  "/register",
  authRateLimiter,
  validate({ body: registerSchema }),
  authController.register,
);

router.post(
  "/login",
  authRateLimiter,
  validate({ body: loginSchema }),
  authController.login,
);

router.post("/logout", requireAuth, authController.logout);

router.post("/refresh", authController.refresh);

router.post(
  "/forgot-password",
  authRateLimiter,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword,
);

router.post(
  "/reset-password",
  authRateLimiter,
  validate({ body: resetPasswordSchema }),
  authController.resetPassword,
);

router.post(
  "/google",
  authRateLimiter,
  validate({ body: googleSignInSchema }),
  authController.googleSignIn,
);

export default router;
