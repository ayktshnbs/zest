// Durable-evidence regression test.
//
// This is the test that would have caught the deferred hole. The earlier fix
// attempt made the failure CALLBACK behave correctly (order not failed, stock
// not restored) while still letting settlement overwrite the `succeeded`
// payment row. That row is what jobs/expirePendingOrders.js reads:
//
//     AND NOT EXISTS (SELECT 1 FROM payments p
//                      WHERE p.order_id = o.id
//                        AND (p.status = 'succeeded'
//                             OR p.created_at > NOW() - ttl))
//
// Erase it and the sweep cancels the order and restocks a paid purchase — the
// same money-safety violation, just minutes later. So asserting the callback's
// immediate effects is NOT enough; the durable row has to be asserted too.

import "./helpers/env.js";

import test, { before, after, beforeEach, describe } from "node:test";
import assert from "node:assert/strict";

import {
  migrate,
  reset,
  closePool,
  createUser,
  createOrder,
  createPayment,
  getOrder,
  getPayment,
  getStock,
  pool,
} from "./helpers/db.js";
import { deliverCallback, legacyMerchantOid } from "./helpers/callback.js";
import { expirePendingOrders } from "../jobs/expirePendingOrders.js";
import { config } from "../config.js";

const PRODUCT = "test-widget";
const TOTAL = 10_000;
const STOCK_AFTER_RESERVE = 4;
const TTL = config.orderExpiry.ttlMinutes; // default 60

/** The sweep's candidate scan, verbatim, so the test tracks the real query. */
const candidateScan = async (ttlMinutes = TTL) => {
  const { rows } = await pool.query(
    `SELECT o.id
       FROM orders o
      WHERE o.status = 'pending'
        AND o.created_at < NOW() - ($1 || ' minutes')::interval
        AND NOT EXISTS (
          SELECT 1 FROM payments p
           WHERE p.order_id = o.id
             AND (
               p.status = 'succeeded'
               OR p.created_at > NOW() - ($1 || ' minutes')::interval
             )
        )
      ORDER BY o.created_at
      LIMIT 200`,
    [String(ttlMinutes)],
  );
  return rows.map((r) => r.id);
};

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

describe("expiry sweep durable-evidence regression", () => {
  test("8. after mismatch-success + failure, the order is NOT an expiry candidate", async () => {
    // Order and attempt are both OLDER than the TTL, so the sweep's recency
    // arm cannot be what protects the order. Only EXISTS(succeeded) can.
    const oldTs = new Date(Date.now() - (TTL + 120) * 60_000).toISOString();

    const order = await createOrder({
      userId: user.id,
      productId: PRODUCT,
      unitPriceCents: TOTAL,
      stockAfterReserve: STOCK_AFTER_RESERVE,
      createdAt: oldTs,
    });
    const oid = legacyMerchantOid(order.id);
    const payment = await createPayment({
      orderId: order.id,
      providerSessionId: oid,
      amountCents: TOTAL,
      createdAt: oldTs,
    });

    // Sanity: with only a stale `pending` attempt it IS a candidate. If this
    // fails the test is vacuous and proves nothing.
    assert.deepEqual(
      await candidateScan(),
      [order.id],
      "precondition: a stale pending order must be sweepable",
    );

    // 1-4. Success with a mismatched amount → money captured, order stays pending.
    const ok = await deliverCallback({
      merchantOid: oid,
      status: "success",
      totalAmount: TOTAL + 1,
    });
    assert.equal(ok.status, 200);
    assert.equal((await getOrder(order.id)).status, "pending");
    assert.equal((await getPayment(payment.id)).status, "succeeded");

    assert.deepEqual(
      await candidateScan(),
      [],
      "a succeeded payment must remove the order from the sweep",
    );

    // 5. Later failure callback for the same legacy oid.
    const fail = await deliverCallback({
      merchantOid: oid,
      status: "failed",
      totalAmount: TOTAL,
      failedReasonCode: "51",
    });
    assert.equal(fail.status, 200);

    // ── The assertion that matters ────────────────────────────────────
    assert.equal(
      (await getPayment(payment.id)).status,
      "succeeded",
      "REGRESSION: the failure callback erased the succeeded evidence",
    );
    assert.deepEqual(
      await candidateScan(),
      [],
      "REGRESSION: order became sweepable again — it would be cancelled and restocked",
    );

    // And the real sweep agrees.
    const { cancelled } = await expirePendingOrders(TTL);
    assert.equal(cancelled, 0, "sweep must not cancel a paid order");

    const finalOrder = await getOrder(order.id);
    assert.equal(finalOrder.status, "pending", "order not cancelled");
    assert.equal(finalOrder.stock_restored_at, null, "reservation still held");
    assert.equal(await getStock(PRODUCT), STOCK_AFTER_RESERVE, "stock not restored");
  });

  test("8b. counter-factual: if the succeeded row IS regressed, the sweep does cancel", async () => {
    // Proves the assertion above is load-bearing rather than accidentally
    // green. Here the regression is applied by hand, bypassing the guard.
    const oldTs = new Date(Date.now() - (TTL + 120) * 60_000).toISOString();

    const order = await createOrder({
      userId: user.id,
      productId: PRODUCT,
      unitPriceCents: TOTAL,
      stockAfterReserve: STOCK_AFTER_RESERVE,
      createdAt: oldTs,
    });
    const payment = await createPayment({
      orderId: order.id,
      providerSessionId: legacyMerchantOid(order.id),
      status: "succeeded",
      amountCents: TOTAL,
      createdAt: oldTs,
    });

    assert.deepEqual(await candidateScan(), [], "succeeded row protects the order");

    await pool.query("UPDATE payments SET status = 'failed' WHERE id = $1", [payment.id]);

    assert.deepEqual(
      await candidateScan(),
      [order.id],
      "erasing the evidence makes the order sweepable — this is the hole the guard closes",
    );

    const { cancelled } = await expirePendingOrders(TTL);
    assert.equal(cancelled, 1);
    assert.equal((await getOrder(order.id)).status, "cancelled");
    assert.equal(
      await getStock(PRODUCT),
      STOCK_AFTER_RESERVE + 1,
      "stock restored — exactly the outcome the guard prevents",
    );
  });
});
