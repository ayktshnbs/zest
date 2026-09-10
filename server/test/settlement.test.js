// Payment settlement state transitions, against a real Postgres.
//
// Every assertion reads the DATABASE, not the handler's return value — the
// invariants being protected are durable rows that other subsystems
// (expirePendingOrders in particular) read minutes later.

import "./helpers/env.js";

import test, { before, after, beforeEach, describe } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import {
  migrate,
  reset,
  closePool,
  createUser,
  createOrder,
  createPayment,
  getOrder,
  getPayment,
  getPaymentsForOrder,
  getStock,
  getAuditActions,
  getWebhookEvents,
} from "./helpers/db.js";
import {
  deliverCallback,
  buildMerchantOid,
  legacyMerchantOid,
} from "./helpers/callback.js";
import * as PaymentModel from "../models/PaymentModel.js";
import { pool } from "../database/pool.js";

const PRODUCT = "test-widget";
const TOTAL = 10_000; // kuruş
const STOCK_AFTER_RESERVE = 4;

let user;

before(async () => {
  await migrate();
});
after(async () => {
  await closePool();
});
beforeEach(async () => {
  await reset();
  user = await createUser();
});

/** An order with its stock reserved and one live legacy attempt row. */
const legacySetup = async ({ orderStatus = "pending" } = {}) => {
  const order = await createOrder({
    userId: user.id,
    productId: PRODUCT,
    unitPriceCents: TOTAL,
    stockAfterReserve: STOCK_AFTER_RESERVE,
    status: orderStatus,
  });
  const oid = legacyMerchantOid(order.id);
  const payment = await createPayment({
    orderId: order.id,
    providerSessionId: oid,
    amountCents: TOTAL,
  });
  return { order, oid, payment };
};

const actionsFor = async (orderId) => (await getAuditActions(orderId)).map((r) => r.action);

describe("payment settlement state transitions", () => {
  // ── Case 1 ──────────────────────────────────────────────────────────
  test("1. success then failure: succeeded row survives, order not failed, stock not restored", async () => {
    const { order, oid, payment } = await legacySetup();

    const ok = await deliverCallback({ merchantOid: oid, status: "success", totalAmount: TOTAL });
    assert.equal(ok.status, 200);

    const fail = await deliverCallback({
      merchantOid: oid,
      status: "failed",
      totalAmount: TOTAL,
      failedReasonCode: "51",
      failedReasonMsg: "Insufficient funds",
    });
    assert.equal(fail.status, 200, "failure callback is acknowledged, not retried");

    const row = await getPayment(payment.id);
    assert.equal(row.status, "succeeded", "succeeded→failed regression must be refused");

    const o = await getOrder(order.id);
    assert.equal(o.status, "paid", "order stays paid");
    assert.equal(o.stock_restored_at, null, "stock reservation still held");
    assert.equal(await getStock(PRODUCT), STOCK_AFTER_RESERVE, "stock not restored");

    // The order is already `paid`, so the conflicting-callbacks branch (which
    // only guards a still-`pending` order) is not the alert here; the point is
    // that nothing was destroyed. Assert no stock/status damage instead.
    const acts = await actionsFor(order.id);
    assert.ok(acts.includes("payment.succeeded"), "success recorded");
  });

  // ── Case 1b: the money-safety variant the fix was built for ─────────
  test("1b. success (amount mismatch) then failure: conflicting_callbacks, no restock", async () => {
    const { order, oid, payment } = await legacySetup();

    // Mismatched amount ⇒ order deliberately left `pending`, money captured.
    const ok = await deliverCallback({
      merchantOid: oid,
      status: "success",
      totalAmount: TOTAL + 1,
    });
    assert.equal(ok.status, 200);
    assert.equal((await getOrder(order.id)).status, "pending", "mismatch leaves order pending");
    assert.equal((await getPayment(payment.id)).status, "succeeded");

    const fail = await deliverCallback({
      merchantOid: oid,
      status: "failed",
      totalAmount: TOTAL,
      failedReasonCode: "51",
    });
    assert.equal(fail.status, 200);

    const row = await getPayment(payment.id);
    assert.equal(row.status, "succeeded", "evidence that money moved must survive");

    const o = await getOrder(order.id);
    assert.equal(o.status, "pending", "order NOT marked failed");
    assert.equal(o.stock_restored_at, null, "stock NOT restored");
    assert.equal(await getStock(PRODUCT), STOCK_AFTER_RESERVE);

    const acts = await actionsFor(order.id);
    assert.ok(acts.includes("payment.amount_mismatch"), "mismatch review written");
    assert.ok(
      acts.includes("payment.conflicting_callbacks"),
      "conflicting callback surfaced for review",
    );

    const review = (await getAuditActions(order.id)).find(
      (r) => r.action === "payment.conflicting_callbacks",
    );
    assert.equal(review.metadata.requiresManualReview, true);
  });

  // ── Case 2 ──────────────────────────────────────────────────────────
  test("2. failure then success: row goes failed -> succeeded, late-success branch runs", async () => {
    const { order, oid, payment } = await legacySetup();

    const fail = await deliverCallback({
      merchantOid: oid,
      status: "failed",
      totalAmount: TOTAL,
      failedReasonCode: "51",
    });
    assert.equal(fail.status, 200);
    assert.equal((await getPayment(payment.id)).status, "failed");
    assert.equal((await getOrder(order.id)).status, "failed");
    assert.equal(
      await getStock(PRODUCT),
      STOCK_AFTER_RESERVE + 1,
      "failure released the reserved unit",
    );

    const ok = await deliverCallback({ merchantOid: oid, status: "success", totalAmount: TOTAL });
    assert.equal(ok.status, 200, "success is NOT discarded as a duplicate");

    assert.equal((await getPayment(payment.id)).status, "succeeded", "success wins");

    const o = await getOrder(order.id);
    assert.equal(o.status, "paid", "late-success branch re-opened the order");
    assert.equal(o.stock_restored_at, null, "stock re-reserved");
    assert.equal(await getStock(PRODUCT), STOCK_AFTER_RESERVE, "unit taken back");

    const acts = await actionsFor(order.id);
    assert.ok(acts.includes("payment.succeeded_after_release"));
  });

  // ── Case 4 ──────────────────────────────────────────────────────────
  test("4. duplicate success: applied exactly once", async () => {
    const { order, oid } = await legacySetup();

    const first = await deliverCallback({ merchantOid: oid, status: "success", totalAmount: TOTAL });
    const second = await deliverCallback({ merchantOid: oid, status: "success", totalAmount: TOTAL });
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);

    assert.equal((await getWebhookEvents()).length, 1, "one webhook event for one callback");
    assert.equal((await getPaymentsForOrder(order.id)).length, 1, "no duplicate payment row");
    assert.equal((await getOrder(order.id)).status, "paid");
    assert.equal(await getStock(PRODUCT), STOCK_AFTER_RESERVE);

    const acts = await actionsFor(order.id);
    assert.equal(
      acts.filter((a) => a === "payment.succeeded").length,
      1,
      "effects applied once",
    );
    assert.ok(!acts.includes("payment.double_charge_detected"), "not a double charge");
  });

  // ── Case 5 ──────────────────────────────────────────────────────────
  test("5. duplicate failure: applied exactly once", async () => {
    const { order, oid, payment } = await legacySetup();

    const a = await deliverCallback({
      merchantOid: oid, status: "failed", totalAmount: TOTAL, failedReasonCode: "51",
    });
    const b = await deliverCallback({
      merchantOid: oid, status: "failed", totalAmount: TOTAL, failedReasonCode: "51",
    });
    assert.equal(a.status, 200);
    assert.equal(b.status, 200);

    assert.equal((await getWebhookEvents()).length, 1);
    assert.equal((await getPayment(payment.id)).status, "failed");
    assert.equal((await getOrder(order.id)).status, "failed");
    assert.equal(
      await getStock(PRODUCT),
      STOCK_AFTER_RESERVE + 1,
      "stock restored exactly once (stock_restored_at guard)",
    );
  });

  // ── Case 6: new-format cross-check ──────────────────────────────────
  test("6. A1 succeeded, failure for A2: A2 fails, A1 untouched, no restock", async () => {
    const order = await createOrder({
      userId: user.id,
      productId: PRODUCT,
      unitPriceCents: TOTAL,
      stockAfterReserve: STOCK_AFTER_RESERVE,
    });

    const oid1 = buildMerchantOid(order.id, 1);
    const oid2 = buildMerchantOid(order.id, 2);

    const a1 = await createPayment({
      orderId: order.id,
      providerSessionId: oid1,
      providerPaymentId: `paytr_${oid1}`,
      status: "succeeded",
      amountCents: TOTAL,
    });
    const a2 = await createPayment({
      orderId: order.id,
      providerSessionId: oid2,
      status: "pending",
      amountCents: TOTAL,
    });

    const res = await deliverCallback({
      merchantOid: oid2, status: "failed", totalAmount: TOTAL, failedReasonCode: "51",
    });
    assert.equal(res.status, 200);

    assert.equal((await getPayment(a2.id)).status, "failed", "A2 settles to failed");
    assert.equal((await getPayment(a1.id)).status, "succeeded", "A1 untouched");

    const o = await getOrder(order.id);
    assert.equal(o.stock_restored_at, null, "no restock while money is on the order");
    assert.equal(await getStock(PRODUCT), STOCK_AFTER_RESERVE);

    const acts = await actionsFor(order.id);
    assert.ok(acts.includes("payment.conflicting_callbacks"));
  });

  // ── Case 7: the Task-1 disambiguation ───────────────────────────────
  //
  // The defect: applySettlement returned null both when the guard refused a
  // succeeded→failed transition AND when the id matched nothing, so a genuine
  // "row not found" was reinterpreted as a successful protection.
  //
  // Note on reachability: through the public API `missing_row` is defensive
  // only — settleAttempt only ever passes ids it SELECTed FOR UPDATE in the
  // same transaction, so the row cannot vanish. These assertions therefore
  // target the SQL that makes the two cases distinguishable, which is exactly
  // what Task 1 required, plus the two outcomes that ARE reachable end to end.
  test("7. the three settlement outcomes are distinguishable at the SQL level", async () => {
    const { order, oid, payment } = await legacySetup();
    const patch = {
      providerPaymentId: `paytr_${oid}`,
      status: "failed",
      amountCents: TOTAL,
      currency: "TRY",
      failureReason: "test",
      raw: null,
    };
    const runCte = async (client, id, p) => {
      const { rows } = await client.query(
        `WITH target AS (SELECT * FROM payments WHERE id = $1 FOR UPDATE),
              updated AS (
                UPDATE payments pm
                   SET status = $2, provider_payment_id = $3, amount_cents = $4,
                       currency = $5, failure_reason = $6, raw_payload = $7,
                       updated_at = NOW()
                  FROM target t
                 WHERE pm.id = t.id
                   AND NOT ($2::text = 'failed' AND t.status = 'succeeded')
                 RETURNING pm.*
              )
         SELECT (SELECT count(*) FROM target)::int  AS target_found,
                (SELECT to_jsonb(u) FROM updated u) AS updated_row,
                (SELECT to_jsonb(t) FROM target t)  AS existing_row`,
        [id, p.status, p.providerPaymentId, p.amountCents, p.currency, p.failureReason, p.raw],
      );
      return rows[0];
    };

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // (a) missing row  → target_found = 0
      const missing = await runCte(client, crypto.randomUUID(), patch);
      assert.equal(missing.target_found, 0, "missing row is reported as target_found = 0");
      assert.equal(missing.updated_row, null);
      assert.equal(missing.existing_row, null);

      // (b) settled      → target_found = 1, updated_row present
      const settled = await runCte(client, payment.id, patch);
      assert.equal(settled.target_found, 1);
      assert.ok(settled.updated_row, "pending row settles");
      assert.equal(settled.updated_row.status, "failed");

      await client.query("ROLLBACK");

      // (c) protected    → target_found = 1, updated_row null, existing_row present
      await client.query("BEGIN");
      await client.query("UPDATE payments SET status = 'succeeded' WHERE id = $1", [payment.id]);
      const protectedRes = await runCte(client, payment.id, patch);
      assert.equal(protectedRes.target_found, 1, "the row exists…");
      assert.equal(protectedRes.updated_row, null, "…but the guard refused the regression");
      assert.equal(
        protectedRes.existing_row.status,
        "succeeded",
        "existing_row reports what is actually there",
      );
      await client.query("ROLLBACK");
    } finally {
      client.release();
    }

    // (b) and (c) reachable end to end, via settleAttempt on the real path.
    const c2 = await pool.connect();
    try {
      await c2.query("BEGIN");
      const first = await PaymentModel.settleAttempt(
        { orderId: order.id, providerSessionId: oid, providerPaymentId: `paytr_${oid}`,
          status: "succeeded", amountCents: TOTAL, currency: "TRY", rawPayload: null },
        c2,
      );
      assert.equal(first.outcome, "settled");

      const second = await PaymentModel.settleAttempt(
        { orderId: order.id, providerSessionId: oid, providerPaymentId: `paytr_${oid}`,
          status: "failed", amountCents: TOTAL, currency: "TRY", rawPayload: null },
        c2,
      );
      assert.equal(second.outcome, "protected_succeeded", "not 'settled', not 'missing_row'");
      assert.equal(second.row.status, "succeeded", "row is returned so callers can log it");
      await c2.query("ROLLBACK");
    } finally {
      c2.release();
    }
  });

  // ── Case 7b: a throw inside processing must reach the H1 retry path ──
  test("7b. a forged signature is rejected, and a handler throw yields 500 RETRY with nothing committed", async () => {
    const { order, oid } = await legacySetup();

    // Forged hash → 400 before anything is claimed or written.
    const forged = await deliverCallback({
      merchantOid: oid, status: "success", totalAmount: TOTAL, hash: "not-a-valid-hash",
    });
    assert.equal(forged.status, 400);
    assert.equal((await getWebhookEvents()).length, 0, "no claim written");
    assert.equal((await getOrder(order.id)).status, "pending");

    // Unresolvable merchant_oid → handler throws → ROLLBACK → 500 RETRY.
    const ghostOid = `PAYTR-${crypto.randomUUID()}`;
    const res = await deliverCallback({
      merchantOid: ghostOid, status: "success", totalAmount: TOTAL,
    });
    assert.equal(res.status, 500, "never a silent 200");
    assert.equal(res.body, "RETRY");
    assert.equal(
      (await getWebhookEvents()).length,
      0,
      "claim rolled back with the effects ⇒ the callback stays replayable",
    );
  });
});
