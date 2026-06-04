// /api/favorites/*

import { Router } from "express";
import { z } from "zod";
import * as favoriteController from "../controllers/favoriteController.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";

const productIdSchema = z.string().min(1).max(120);

const addSchema = z.object({ productId: productIdSchema });
const paramSchema = z.object({ productId: productIdSchema });
const mergeSchema = z.object({
  productIds: z.array(productIdSchema).max(500).default([]),
});

const router = Router();
router.use(requireAuth);

router.get("/", favoriteController.list);

router.post("/", validate({ body: addSchema }), favoriteController.add);

router.post("/merge", validate({ body: mergeSchema }), favoriteController.merge);

router.delete(
  "/:productId",
  validate({ params: paramSchema }),
  favoriteController.remove,
);

export default router;
