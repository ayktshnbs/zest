// Typed error classes. Throw from anywhere; the error handler middleware
// inspects `status` and `code` to format a safe JSON response.
//
// Never put sensitive details in `message` — it's returned to the client.

export class AppError extends Error {
  /**
   * @param {string} message     User-safe message
   * @param {number} status      HTTP status code
   * @param {string} code        Short machine-readable code
   * @param {object} [details]   Extra detail (e.g. validation field errors)
   */
  constructor(message, status = 500, code = "internal_error", details) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", details) {
    super(message, 400, "bad_request", details);
  }
}

export class ValidationError extends AppError {
  constructor(details, message = "Validation failed") {
    super(message, 422, "validation_error", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "unauthorized");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "forbidden");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404, "not_found");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409, "conflict");
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429, "rate_limited");
  }
}
