// /api/admin/* — admin-only (requireAuth + requireRole('admin')).

import { Router } from "express";
import { z } from "zod";
import * as adminController from "../controllers/adminController.js";
import { validate } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  adminOrderListSchema,
  updateOrderStatusSchema,
  setStockSchema,
  uuidSchema,
} from "../utils/validation.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get(
  "/orders",
  validate({ query: adminOrderListSchema }),
  adminController.listOrders,
);
router.get(
  "/orders/:id",
  validate({ params: z.object({ id: uuidSchema }) }),
  adminController.getOrder,
);
router.patch(
  "/orders/:id",
  validate({ params: z.object({ id: uuidSchema }), body: updateOrderStatusSchema }),
  adminController.updateOrderStatus,
);

router.get("/stock", adminController.listStock);
router.patch(
  "/stock/:productId",
  validate({
    params: z.object({ productId: z.string().min(1).max(120) }),
    body: setStockSchema,
  }),
  adminController.setStock,
);

export default router;
