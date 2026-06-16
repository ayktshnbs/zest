// /api/admin/* — admin-only (requireAuth + requireRole('admin')).

import { Router } from "express";
import { z } from "zod";
import * as adminController from "../controllers/adminController.js";
import { validate } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  adminOrderListSchema,
  updateOrderSchema,
  setStockSchema,
  updateProductSchema,
  createCategorySchema,
  updateCategorySchema,
  createCustomProductSchema,
  updateCustomProductSchema,
  signUploadSchema,
  slugSchema,
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
  validate({ params: z.object({ id: uuidSchema }), body: updateOrderSchema }),
  adminController.updateOrder,
);

router.get("/products", adminController.listProducts);
router.patch(
  "/products/:productId",
  validate({
    params: z.object({ productId: z.string().min(1).max(120) }),
    body: updateProductSchema,
  }),
  adminController.updateProduct,
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

// Cloudinary signed upload payload
router.post(
  "/uploads/sign",
  validate({ body: signUploadSchema }),
  adminController.signUpload,
);

// Admin-managed categories
router.get("/categories", adminController.listCategories);
router.post(
  "/categories",
  validate({ body: createCategorySchema }),
  adminController.createCategory,
);
router.patch(
  "/categories/:slug",
  validate({ params: z.object({ slug: slugSchema }), body: updateCategorySchema }),
  adminController.updateCategory,
);
router.delete(
  "/categories/:slug",
  validate({ params: z.object({ slug: slugSchema }) }),
  adminController.deleteCategory,
);

// Custom (admin-added) products
router.get("/custom-products", adminController.listCustomProducts);
router.post(
  "/custom-products",
  validate({ body: createCustomProductSchema }),
  adminController.createCustomProduct,
);
router.patch(
  "/custom-products/:id",
  validate({
    params: z.object({ id: z.string().min(1).max(120) }),
    body: updateCustomProductSchema,
  }),
  adminController.updateCustomProduct,
);
router.delete(
  "/custom-products/:id",
  validate({ params: z.object({ id: z.string().min(1).max(120) }) }),
  adminController.deleteCustomProduct,
);

export default router;
