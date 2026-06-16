-- Fulfillment status
-- ---------------------------------------------------------------------------
-- The existing orders.status tracks the PAYMENT lifecycle
-- (pending/paid/cancelled/refunded). Shipping is a separate axis, so add a
-- dedicated fulfillment_status the order desk can advance independently:
-- preparing → shipped → delivered. Default backfills existing rows.

ALTER TABLE orders
  ADD COLUMN fulfillment_status TEXT NOT NULL DEFAULT 'preparing'
    CHECK (fulfillment_status IN ('preparing', 'shipped', 'delivered'));

CREATE INDEX orders_fulfillment_idx ON orders (fulfillment_status);
