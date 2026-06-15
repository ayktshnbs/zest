// /api/catalog/* — public, read-only (no auth, no CSRF).

import { Router } from "express";
import * as catalogController from "../controllers/catalogController.js";

const router = Router();

router.get("/stock", catalogController.getStock);

export default router;
