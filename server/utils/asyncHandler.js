// Wraps an async route handler so rejected promises reach the Express
// error pipeline. Use everywhere instead of try/catch + next(err).

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
