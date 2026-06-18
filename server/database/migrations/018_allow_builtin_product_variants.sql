-- Allow built-in (static catalog) product ids in product_variants.
-- ---------------------------------------------------------------------------
-- Originally product_variants.product_id FK'd custom_products(id) because only
-- admin-added "set" products had color choices. We now want built-in products
-- (rnd-rev, skl-m6, skl-m7, soy-sol1, soy-sol2, srv-sua, srv-suh) to carry
-- variants too. Built-in ids only exist in lib/products.ts, not in any table,
-- so the FK has to go. Cleanup of orphaned rows is handled in application
-- code (retired-id list + sync scripts).

ALTER TABLE product_variants
  DROP CONSTRAINT IF EXISTS product_variants_product_id_fkey;
