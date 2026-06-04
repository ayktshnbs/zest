// /api/payments/*  — checkout session creation. Webhooks live elsewhere.

import { Router } from "express";
import * as paymentController from "../controllers/paymentController.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { createCheckoutSchema } from "../utils/validation.js";

const router = Router();

router.use(requireAuth);

router.post(
  "/checkout",
  validate({ body: createCheckoutSchema }),
  paymentController.createCheckout,
);

export default router;
