// /api/orders/*  — every route requires authentication.

import { Router } from "express";
import { z } from "zod";
import * as orderController from "../controllers/orderController.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import {
  createOrderSchema,
  paginationSchema,
  uuidSchema,
} from "../utils/validation.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  validate({ query: paginationSchema }),
  orderController.listOrders,
);

router.post(
  "/",
  validate({ body: createOrderSchema }),
  orderController.createOrder,
);

router.get(
  "/:id",
  validate({ params: z.object({ id: uuidSchema }) }),
  orderController.getOrder,
);

export default router;
