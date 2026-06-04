// Liveness + readiness probes. Mounted before CSRF — safe to hit anonymously.

import { Router } from "express";
import { query } from "../database/pool.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ status: "ok", service: "zest-kitchene-api", time: new Date().toISOString() });
});

router.get(
  "/ready",
  asyncHandler(async (_req, res) => {
    try {
      await query("SELECT 1");
      res.json({ status: "ready" });
    } catch (err) {
      res.status(503).json({ status: "degraded", error: err.message });
    }
  }),
);

export default router;
