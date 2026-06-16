-- Refine the two order status enums.
--   payment (orders.status): add 'failed', retire legacy 'fulfilled' (→ 'paid')
--   fulfillment:             processing/packed/shipped/delivered/returned
--                            (was preparing/shipped/delivered)
--
-- The inline CHECKs from 005/012 are auto-named orders_status_check and
-- orders_fulfillment_status_check. We migrate existing rows FIRST so the new
-- CHECKs accept them, then swap the constraints. Runs after 012 in filename
-- order, so the column always exists; idempotent for a fresh DB.

-- Payment status
UPDATE orders SET status = 'paid' WHERE status = 'fulfilled';
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded'));

-- Fulfillment status
ALTER TABLE orders ALTER COLUMN fulfillment_status SET DEFAULT 'processing';
UPDATE orders SET fulfillment_status = 'processing' WHERE fulfillment_status = 'preparing';
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_fulfillment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_fulfillment_status_check
  CHECK (fulfillment_status IN ('processing', 'packed', 'shipped', 'delivered', 'returned'));
