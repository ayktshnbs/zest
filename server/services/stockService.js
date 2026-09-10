// Order stock accounting — the single place that gives reserved units back to
// inventory and takes them again.
//
// Stock is decremented when an order is created (orderController.createOrder).
// Three separate paths need to hand it back: a failed payment, the pending
// expiry sweep, and an admin cancelling/refunding. Doing that in three places
// is how the same order ends up restocked twice, so they all call in here.
//
// Exactly-once contract
// ---------------------
// orders.stock_restored_at is the guard (migration 021). Restoring claims the
// order with
//     UPDATE orders SET stock_restored_at = NOW()
//      WHERE id = $1 AND stock_restored_at IS NULL
// inside the caller's transaction. A second caller — another request, another
// instance, a webhook racing the sweep — gets 0 rows and does nothing. The
// claim and the inventory UPDATEs commit together, so a rollback un-claims it.
//
// Re-reserving (payment retry) is the mirror image: it clears the flag under
// the opposite guard and decrements again, all in one transaction.
//
// Line items are JSONB snapshots on the order, and mirror what createOrder
// decremented:
//     item.variantId present → product_variants.stock
//     otherwise              → inventory.stock  (keyed by item.productId)

/** Collapse an order's line items into the two stock buckets, qty-summed. */
const bucketItems = (items) => {
  const variantQty = new Map();
  const productQty = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    const qty = Number(item?.quantity) || 0;
    if (qty <= 0) continue;
    if (item.variantId) {
      variantQty.set(item.variantId, (variantQty.get(item.variantId) ?? 0) + qty);
    } else if (item.productId) {
      productQty.set(item.productId, (productQty.get(item.productId) ?? 0) + qty);
    }
  }
  return { variantQty, productQty };
};

/**
 * Give an order's reserved units back to inventory — at most once, ever.
 *
 * Runs on the caller's transaction client so the claim and the increments
 * commit atomically. Returns true when THIS call performed the restore, false
 * when the order was already restored (or doesn't exist) and nothing was done.
 *
 * @param {import("pg").PoolClient} client  transaction client
 * @param {string} orderId
 */
export const restoreOrderStock = async (client, orderId) => {
  const { rows } = await client.query(
    `UPDATE orders SET stock_restored_at = NOW()
      WHERE id = $1 AND stock_restored_at IS NULL
      RETURNING items`,
    [orderId],
  );
  if (rows.length === 0) return false; // already restored — do nothing

  const { variantQty, productQty } = bucketItems(rows[0].items);
  // Sorted so concurrent restores/reservations touch rows in a stable order.
  for (const productId of [...productQty.keys()].sort()) {
    await client.query(
      `UPDATE inventory SET stock = stock + $2 WHERE product_id = $1`,
      [productId, productQty.get(productId)],
    );
  }
  for (const variantId of [...variantQty.keys()].sort()) {
    await client.query(
      `UPDATE product_variants SET stock = stock + $2 WHERE id = $1`,
      [variantId, variantQty.get(variantId)],
    );
  }
  return true;
};

/**
 * Take the units back for an order whose stock was previously restored — the
 * retry-a-declined-payment path.
 *
 * Mirrors createOrder: lock every row FOR UPDATE in a stable order, reject the
 * whole thing if anything is short, then decrement. Clearing
 * stock_restored_at is part of the same transaction, so a shortfall leaves the
 * order exactly as it was.
 *
 * @returns {Promise<{ ok: true } | { ok: false, reason: "already_reserved" | "insufficient", items?: object[] }>}
 */
export const reserveOrderStock = async (client, orderId) => {
  const { rows } = await client.query(
    `UPDATE orders SET stock_restored_at = NULL
      WHERE id = $1 AND stock_restored_at IS NOT NULL
      RETURNING items`,
    [orderId],
  );
  // Nothing to do: the order still holds its reservation.
  if (rows.length === 0) return { ok: true, reason: "already_reserved" };

  const { variantQty, productQty } = bucketItems(rows[0].items);
  const productIds = [...productQty.keys()].sort();
  const variantIds = [...variantQty.keys()].sort();

  const insufficient = [];
  for (const productId of productIds) {
    const needed = productQty.get(productId);
    const { rows: r } = await client.query(
      `SELECT product_id, stock FROM inventory WHERE product_id = $1 FOR UPDATE`,
      [productId],
    );
    const available = r[0] ? r[0].stock : 0;
    if (available < needed) insufficient.push({ productId, requested: needed, available });
  }
  for (const variantId of variantIds) {
    const needed = variantQty.get(variantId);
    const { rows: r } = await client.query(
      `SELECT id, stock FROM product_variants WHERE id = $1 FOR UPDATE`,
      [variantId],
    );
    const available = r[0] ? r[0].stock : 0;
    if (available < needed) insufficient.push({ variantId, requested: needed, available });
  }
  if (insufficient.length > 0) {
    // Put the released flag back. Callers that abort the whole transaction
    // (checkout, admin) would undo the clear anyway, but the webhook COMMITS
    // after a failed re-reservation so it can still record the payment — and
    // without this the order would be marked as holding a reservation it never
    // took, inflating inventory the next time anything restored it.
    await client.query(
      `UPDATE orders SET stock_restored_at = NOW()
        WHERE id = $1 AND stock_restored_at IS NULL`,
      [orderId],
    );
    return { ok: false, reason: "insufficient", items: insufficient };
  }

  for (const productId of productIds) {
    await client.query(
      `UPDATE inventory SET stock = stock - $2 WHERE product_id = $1`,
      [productId, productQty.get(productId)],
    );
  }
  for (const variantId of variantIds) {
    await client.query(
      `UPDATE product_variants SET stock = stock - $2 WHERE id = $1`,
      [variantId, variantQty.get(variantId)],
    );
  }
  return { ok: true };
};
