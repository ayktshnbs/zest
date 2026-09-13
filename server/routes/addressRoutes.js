// /api/users/me/addresses/*  — every route requires authentication.
// Mounted under the same /api/users/me/* nesting the app already uses for
// account actions (see userRoutes.js's /me/change-password).

import { Router } from "express";
import { z } from "zod";
import * as addressController from "../controllers/addressController.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import {
  createAddressSchema,
  updateAddressSchema,
  uuidSchema,
} from "../utils/validation.js";

const idParamSchema = z.object({ id: uuidSchema });

const router = Router();
router.use(requireAuth);

router.get("/", addressController.list);

router.post("/", validate({ body: createAddressSchema }), addressController.create);

router.patch(
  "/:id",
  validate({ params: idParamSchema, body: updateAddressSchema }),
  addressController.update,
);

router.delete(
  "/:id",
  validate({ params: idParamSchema }),
  addressController.remove,
);

router.post(
  "/:id/default",
  validate({ params: idParamSchema }),
  addressController.setDefault,
);

export default router;
