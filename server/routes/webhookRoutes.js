// /api/webhooks/*  — mounted BEFORE the CSRF middleware in app.js.
// PayTR sends callbacks as application/x-www-form-urlencoded.

import { Router } from "express";
import * as webhookController from "../controllers/webhookController.js";

const router = Router();

router.post("/paytr", webhookController.paytrCallback);

export default router;
