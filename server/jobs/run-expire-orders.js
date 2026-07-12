// Manual / external-cron entrypoint for the pending-order expiry sweep.
// Usage: npm run expire-orders   (or: node --env-file=.env jobs/run-expire-orders.js)
// Exits 0 on success so external schedulers (Render Cron, GitHub Actions,
// crontab) can alert on failures.

import { expirePendingOrders } from "./expirePendingOrders.js";
import { pool } from "../database/pool.js";
import { logger } from "../utils/logger.js";

try {
  const result = await expirePendingOrders();
  logger.info(result, "expire-orders run complete");
  await pool.end();
  process.exit(0);
} catch (err) {
  logger.error({ err }, "expire-orders run failed");
  await pool.end().catch(() => {});
  process.exit(1);
}
