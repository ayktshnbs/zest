-- Order stock accounting + payment attempt counter
-- ---------------------------------------------------------------------------
-- Stock is reserved (decremented) when an order is CREATED. Until now the only
-- thing that ever gave it back was the pending-order expiry sweep, so a failed
-- payment leaked its units permanently. Two columns fix that:
--
--   stock_restored_at  Single source of truth for "this order's reserved units
--                      have been returned to inventory". Every restore path
--                      (payment failure, expiry sweep, admin cancel/refund)
--                      claims the order with
--                        UPDATE ... SET stock_restored_at = NOW()
--                         WHERE id = $1 AND stock_restored_at IS NULL
--                      so the restore happens AT MOST ONCE no matter how many
--                      paths race. Re-reserving (payment retry) sets it back
--                      to NULL under the same guard, in the same transaction
--                      as the decrement.
--
--   payment_attempts   Monotonic counter used to build a unique PayTR
--                      merchant_oid per attempt. PayTR rejects a reused
--                      merchant_oid, and our webhook idempotency key is
--                      derived from it — so a per-attempt value is what makes
--                      retrying a declined card possible at all.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stock_restored_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_attempts INTEGER NOT NULL DEFAULT 0;

-- Orders that already reached a terminal, stock-returning state before this
-- migration had their stock returned by the expiry sweep (cancelled) or never
-- reserved it back (failed — the leak this migration closes). Backfill only
-- 'cancelled', which the sweep provably already restored, so the guard above
-- can't hand those units out a second time. 'failed' rows are deliberately
-- left NULL: their units are still missing and an operator can reconcile them.
UPDATE orders SET stock_restored_at = updated_at
 WHERE status = 'cancelled' AND stock_restored_at IS NULL;

CREATE INDEX IF NOT EXISTS orders_stock_restored_idx
  ON orders (stock_restored_at)
  WHERE stock_restored_at IS NULL;
