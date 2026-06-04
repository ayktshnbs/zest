// zod schema runner. Pass a schema for the body, params, or query and
// the parsed/coerced value lands on `req.validated.<part>` for the
// controller to consume. Errors propagate to the error handler.

export const validate = (schemas) => (req, _res, next) => {
  try {
    req.validated = req.validated || {};
    if (schemas.body) req.validated.body = schemas.body.parse(req.body);
    if (schemas.params) req.validated.params = schemas.params.parse(req.params);
    if (schemas.query) req.validated.query = schemas.query.parse(req.query);
    next();
  } catch (err) {
    next(err);
  }
};
