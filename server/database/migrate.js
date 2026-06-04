// Idempotent SQL migration runner.
// Applies every *.sql file in database/migrations/ in filename order,
// recording each filename in the schema_migrations table. Re-running
// is safe — already-applied files are skipped.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool, withTransaction } from "./pool.js";
import { logger } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, "migrations");

const ensureMigrationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

const appliedSet = async () => {
  const { rows } = await pool.query("SELECT filename FROM schema_migrations");
  return new Set(rows.map((r) => r.filename));
};

const main = async () => {
  await ensureMigrationsTable();
  const applied = await appliedSet();

  const files = (await fs.readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const pending = files.filter((f) => !applied.has(f));
  if (pending.length === 0) {
    logger.info("No pending migrations");
    return;
  }

  for (const file of pending) {
    const fullPath = path.join(migrationsDir, file);
    const sql = await fs.readFile(fullPath, "utf8");
    logger.info({ file }, "Applying migration");

    await withTransaction(async (client) => {
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (filename) VALUES ($1)",
        [file],
      );
    });

    logger.info({ file }, "Migration applied");
  }
};

main()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error({ err }, "Migration failed");
    process.exit(1);
  });
