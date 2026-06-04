// /api/webhooks/*  — mounted BEFORE express.json() in app.js so the body
// arrives as a raw Buffer for HMAC signature verification.

import { Router } from "express";
import * as webhookController from "../controllers/webhookController.js";

const router = Router();

router.post("/creem", webhookController.creemWebhook);

export default router;
