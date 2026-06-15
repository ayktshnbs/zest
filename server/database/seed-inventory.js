// Seed the inventory table from the generated catalog (server/data/catalog.json).
// Idempotent: inserts a row for any product missing from inventory and NEVER
// overwrites a product already present, so live (decremented) stock is
// preserved across re-runs. Run after migrations:  npm run seed:inventory

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";
import { logger } from "../utils/logger.js";

const here = dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(
  readFileSync(join(here, "..", "data", "catalog.json"), "utf8"),
);

const main = async () => {
  const entries = Object.entries(catalog);
  let inserted = 0;
  for (const [productId, p] of entries) {
    const stock = Number.isFinite(p.stock) ? p.stock : 0;
    const { rowCount } = await pool.query(
      `INSERT INTO inventory (product_id, stock) VALUES ($1, $2)
         ON CONFLICT (product_id) DO NOTHING`,
      [productId, stock],
    );
    inserted += rowCount;
  }
  logger.info(
    { total: entries.length, inserted, preserved: entries.length - inserted },
    "Inventory seed complete",
  );
};

main()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error({ err }, "Inventory seed failed");
    process.exit(1);
  });
