// Single shared pg Pool. Import from anywhere that needs a query/transaction.

import pg from "pg";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";

const { Pool } = pg;

const poolConfig = config.db.connectionString
  ? {
      connectionString: config.db.connectionString,
      ssl: config.db.ssl,
    }
  : {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      ssl: config.db.ssl,
    };

export const pool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  application_name: "zest-kitchene-api",
});

pool.on("error", (err) => {
  logger.error({ err }, "Unexpected error on idle pg client");
});

/**
 * Run a single parametrized query. Always prefer this over template strings.
 * @template T
 * @param {string} text
 * @param {any[]} [params]
 * @returns {Promise<import("pg").QueryResult<T>>}
 */
export const query = (text, params) => pool.query(text, params);

/**
 * Run a function inside a transaction. The callback receives a pg Client
 * that you must use for queries — do NOT mix with the shared pool.
 *
 *   await withTransaction(async (client) => {
 *     await client.query("INSERT INTO ...", []);
 *     await client.query("UPDATE ...", []);
 *   });
 */
export const withTransaction = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      logger.error({ err: rollbackErr }, "Rollback failed");
    }
    throw err;
  } finally {
    client.release();
  }
};
