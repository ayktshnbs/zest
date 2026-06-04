// Structured JSON logger built on pino. Pretty in dev, raw JSON in prod
// (let your log shipper handle parsing).

import { pino } from "pino";

const isProd = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: { service: "zest-kitchene-api" },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.password_hash",
      "*.passwordHash",
      "*.token",
      "*.refresh_token",
      "*.refreshToken",
      "*.access_token",
      "*.accessToken",
    ],
    censor: "[REDACTED]",
  },
  transport: isProd
    ? undefined
    : {
        target: "pino/file",
        options: { destination: 1, sync: false },
      },
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
