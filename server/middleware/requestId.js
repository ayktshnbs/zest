// Tag each request with a stable ID. Forwards an upstream `x-request-id`
// when present, otherwise mints a UUID v4. Echoes the value back as a
// response header so clients can correlate logs.

import crypto from "node:crypto";

export const requestId = (req, res, next) => {
  const incoming = req.headers["x-request-id"];
  const id =
    typeof incoming === "string" && incoming.length > 0 && incoming.length < 200
      ? incoming
      : crypto.randomUUID();
  req.id = id;
  res.setHeader("x-request-id", id);
  next();
};
