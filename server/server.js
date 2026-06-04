// Process entrypoint. Boots the HTTP server and handles graceful shutdown.

import { createApp } from "./app.js";
import { config } from "./config.js";
import { logger } from "./utils/logger.js";
import { pool } from "./database/pool.js";

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.env }, "Server listening");
});

server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

const shutdown = (signal) => async () => {
  logger.info({ signal }, "Shutting down");
  server.close(async (err) => {
    if (err) logger.error({ err }, "Error while closing HTTP server");
    try {
      await pool.end();
      logger.info("Postgres pool closed");
    } catch (poolErr) {
      logger.error({ err: poolErr }, "Error while closing pool");
    }
    process.exit(err ? 1 : 0);
  });

  // Hard exit if graceful shutdown stalls
  setTimeout(() => {
    logger.error("Forced exit after timeout");
    process.exit(1);
  }, 10_000).unref();
};

process.on("SIGTERM", shutdown("SIGTERM"));
process.on("SIGINT", shutdown("SIGINT"));
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception");
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "Unhandled promise rejection");
  process.exit(1);
});
