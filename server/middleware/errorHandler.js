// Centralised error response. Converts thrown errors (typed AppError,
// zod errors, Postgres errors, anything else) into a safe JSON envelope.

import { ZodError } from "zod";
import { AppError } from "../utils/errors.js";
import { config } from "../config.js";

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: { code: "not_found", message: `No route for ${req.method} ${req.path}` },
    requestId: req.id,
  });
};

export const errorHandler = (err, req, res, _next) => {
  // Zod validation errors → 422 with field-level details
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
      code: i.code,
    }));
    return res.status(422).json({
      error: { code: "validation_error", message: "Validation failed", details },
      requestId: req.id,
    });
  }

  // Postgres unique violation → 409
  if (err && err.code === "23505") {
    return res.status(409).json({
      error: { code: "conflict", message: "Resource already exists" },
      requestId: req.id,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
      requestId: req.id,
    });
  }

  // CORS error from cors() callback
  if (err && /CORS/.test(err.message || "")) {
    return res.status(403).json({
      error: { code: "cors_blocked", message: err.message },
      requestId: req.id,
    });
  }

  // csrf-csrf throws an Error with `code === 'EBADCSRFTOKEN'`
  if (err && (err.code === "EBADCSRFTOKEN" || err.code === "ERR_BAD_CSRF_TOKEN")) {
    return res.status(403).json({
      error: { code: "invalid_csrf_token", message: "Invalid CSRF token" },
      requestId: req.id,
    });
  }

  // Unknown — log full detail server-side, return generic message to client
  req.log?.error({ err }, "Unhandled error");
  res.status(500).json({
    error: {
      code: "internal_error",
      message: config.isProd ? "An unexpected error occurred" : err.message,
    },
    requestId: req.id,
  });
};
