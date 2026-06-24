// /api/contact — public contact form submission. No auth required, but CSRF
// is enforced by the app-level middleware mounted above this in app.js.

import { Router } from "express";
import * as contactController from "../controllers/contactController.js";
import { validate } from "../middleware/validate.js";
import { contactSchema } from "../utils/validation.js";

const router = Router();

router.post("/", validate({ body: contactSchema }), contactController.submitContact);

export default router;
