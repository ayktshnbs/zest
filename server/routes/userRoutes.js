// /api/users/*  — every route requires authentication.

import { Router } from "express";
import * as userController from "../controllers/userController.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import {
  updateProfileSchema,
  changePasswordSchema,
} from "../utils/validation.js";

const router = Router();

router.use(requireAuth);

router.get("/me", userController.me);

router.patch(
  "/me",
  validate({ body: updateProfileSchema }),
  userController.updateMe,
);

router.post(
  "/me/change-password",
  validate({ body: changePasswordSchema }),
  userController.changePassword,
);

export default router;
