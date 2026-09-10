// Test database lifecycle + fixtures.
//
// Deliberately runs the REAL migrations against a REAL Postgres. The behaviour
// under test is expressed in SQL — the succeeded→failed guard, the FOR UPDATE
// locking, the expiry sweep's EXISTS(succeeded) arm — so a mock or in-memory
// shim would assert nothing.

import "./env.js";

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

import { pool } from "../../database/pool.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(here, "..", "..", "database", "migrations");

/**
 * Fail fast with an actionable message instead of burying a connection error
 * inside the first migration's stack trace.
 */
const assertConnectable = async () => {
  try {
    await pool.query("SELECT 1");
  } catch (err) {
    const hint =
      err.code === "28P01"
        ? "Wrong username/password in TEST_DATABASE_URL."
        : err.code === "3D000"
          ? "That database does not exist. Create it first: createdb zest_test"
          : err.code === "ECONNREFUSED"
            ? "Nothing is listening — is PostgreSQL running?"
            : `Driver error ${err.code ?? "(none)"}.`;
    throw new Error(
      `Cannot connect to TEST_DATABASE_URL.\n  ${hint}\n  ${err.message}\n` +
        '  Format: postgres://USER:PASSWORD@localhost:5432/zest_test',
    );
  }
};

/** Apply every migration in filename order. Mirrors database/migrate.js. */
export const migrate = async () => {
  await assertConnectable();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  const { rows } = await pool.query("SELECT filename FROM schema_migrations");
  const applied = new Set(rows.map((r) => r.filename));

  const files = (await fs.readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw new Error(`Migration ${file} failed: ${err.message}`);
    } finally {
      client.release();
    }
  }
};

/** Wipe every table the payment tests touch. Order respects FKs. */
export const reset = async () => {
  await pool.query(`
    TRUNCATE webhook_events, audit_logs, payments, orders,
             inventory, product_variants, users
    RESTART IDENTITY CASCADE
  `);
};

export const closePool = () => pool.end();

// ── Fixtures ──────────────────────────────────────────────────────────

export const createUser = async (email = `buyer-${crypto.randomUUID()}@example.test`) => {
  const { rows } = await pool.query(
    `INSERT INTO users (email, name) VALUES ($1, 'Test Buyer') RETURNING *`,
    [email],
  );
  return rows[0];
};

/**
 * An order that has already reserved stock: one non-variant line for
 * `productId`, with a matching inventory row decremented by `quantity`.
 * `stock_restored_at` stays NULL, i.e. "the reservation is held".
 */
export const createOrder = async ({
  userId,
  productId = "test-widget",
  quantity = 1,
  unitPriceCents = 10_000,
  stockAfterReserve = 4,
  status = "pending",
  createdAt = null,
} = {}) => {
  await pool.query(
    `INSERT INTO inventory (product_id, stock) VALUES ($1, $2)
       ON CONFLICT (product_id) DO UPDATE SET stock = EXCLUDED.stock`,
    [productId, stockAfterReserve],
  );

  const items = [{ productId, name: "Test Widget", quantity, unitPriceCents }];
  const total = unitPriceCents * quantity;

  const { rows } = await pool.query(
    `INSERT INTO orders (
       order_number, user_id, status, currency,
       subtotal_cents, shipping_cents, tax_cents, total_cents,
       items, shipping_address, created_at
     ) VALUES ($1, $2, $3, 'TRY', $4, 0, 0, $4, $5, $6, COALESCE($7::timestamptz, NOW()))
     RETURNING *`,
    [
      `ZK-TEST-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
      userId,
      status,
      total,
      JSON.stringify(items),
      JSON.stringify({
        fullName: "Test Buyer",
        line1: "1 Test Street",
        city: "Istanbul",
        postalCode: "34000",
        country: "TR",
      }),
      createdAt,
    ],
  );
  return rows[0];
};

/** A payment attempt row, as createCheckout would have written it. */
export const createPayment = async ({
  orderId,
  providerSessionId,
  providerPaymentId = null,
  status = "pending",
  amountCents = 10_000,
  createdAt = null,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO payments (
       order_id, provider, provider_session_id, provider_payment_id,
       status, amount_cents, currency, created_at
     ) VALUES ($1, 'paytr', $2, $3, $4, $5, 'TRY', COALESCE($6::timestamptz, NOW()))
     RETURNING *`,
    [orderId, providerSessionId, providerPaymentId, status, amountCents, createdAt],
  );
  return rows[0];
};

// ── Assertion readers ─────────────────────────────────────────────────

export const getOrder = async (id) =>
  (await pool.query("SELECT * FROM orders WHERE id = $1", [id])).rows[0];

export const getPayment = async (id) =>
  (await pool.query("SELECT * FROM payments WHERE id = $1", [id])).rows[0];

export const getPaymentsForOrder = async (orderId) =>
  (await pool.query(
    "SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at, id",
    [orderId],
  )).rows;

export const getStock = async (productId) =>
  (await pool.query("SELECT stock FROM inventory WHERE product_id = $1", [productId]))
    .rows[0]?.stock ?? null;

export const getAuditActions = async (orderId) =>
  (await pool.query(
    `SELECT action, metadata FROM audit_logs
      WHERE metadata->>'orderId' = $1 ORDER BY created_at`,
    [String(orderId)],
  )).rows;

export const getWebhookEvents = async () =>
  (await pool.query("SELECT * FROM webhook_events ORDER BY received_at")).rows;

export { pool };
