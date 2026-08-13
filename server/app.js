// Express application factory. Composes middleware and routers.
// Webhooks need the raw body for signature verification, so they
// are mounted BEFORE express.json().

import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";

import { config } from "./config.js";
import { logger } from "./utils/logger.js";
import { requestId } from "./middleware/requestId.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { globalRateLimiter } from "./middleware/rateLimit.js";
import { doubleCsrfProtection, ensureCsrfSession } from "./middleware/csrf.js";

import webhookRoutes from "./routes/webhookRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import catalogRoutes from "./routes/catalogRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

export const createApp = () => {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  // Request observability
  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
      genReqId: (req) => req.id,
    }),
  );

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) => {
        // Allow same-origin tools (no Origin header) and configured frontends
        if (!origin) return cb(null, true);
        if (config.allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    }),
  );

  // PayTR callbacks arrive as application/x-www-form-urlencoded.
  // Mount BEFORE express.json() and CSRF — webhooks are server-to-server.
  app.use(
    "/api/webhooks",
    express.urlencoded({ extended: false, limit: "1mb" }),
    webhookRoutes,
  );

  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false, limit: "100kb" }));
  app.use(cookieParser());

  app.use(globalRateLimiter);

  // Health is intentionally not CSRF-protected (read-only, no cookies needed)
  app.use("/api/health", healthRoutes);

  // Public, read-only catalog data (live stock). No auth/CSRF — mounted before
  // the CSRF gate like health.
  app.use("/api/catalog", catalogRoutes);

  // CSRF protection: applies to state-changing requests on routes mounted below.
  // Webhooks (mounted above) and health checks (mounted above) are exempt.
  // ensureCsrfSession issues the stable csrf_sid the token is bound to.
  app.use(ensureCsrfSession);
  app.use(doubleCsrfProtection);

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/favorites", favoriteRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/contact", contactRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
