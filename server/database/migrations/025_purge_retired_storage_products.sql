-- Purge the retired vacuum-jar built-ins
-- ---------------------------------------------------------------------------
-- The 14 old Saklama Kapları built-ins (skl-esk*, skl-m5, skl-m8) were
-- replaced by the Bonny / Dikdörtgen set products, hidden via
-- product_overrides.is_active = false, and have now been deleted from the
-- storefront seed list (lib/products.ts) and server/data/catalog.json. They
-- were only surfacing in the admin panel as dead "Gizlendi" rows.
--
-- Remove every row keyed on those ids so nothing references a product that no
-- longer exists in the catalog:
--   product_overrides — the is_active=false / name / image override rows
--   inventory         — their stock rows (nothing can be sold from them)
--   product_variants  — colour variants, if any were ever created for them
--   favorites         — customers' saved-item rows (the storefront already
--                       drops favourites whose product is unknown)
--
-- orders.items is a JSON snapshot and is deliberately untouched: order history
-- keeps showing what was bought. stockService's restore is a no-op for a
-- missing inventory row, so an old pending order expiring later is harmless.
--
-- Idempotent: re-running deletes nothing.

DELETE FROM product_variants
 WHERE product_id IN (
   'skl-esk0001','skl-esk0002','skl-esk0003','skl-esk0101','skl-esk0102','skl-esk0103',
   'skl-esk0211','skl-esk0212','skl-esk0213','skl-esk1001','skl-esk1101','skl-esk1211',
   'skl-m5','skl-m8'
 );

DELETE FROM favorites
 WHERE product_id IN (
   'skl-esk0001','skl-esk0002','skl-esk0003','skl-esk0101','skl-esk0102','skl-esk0103',
   'skl-esk0211','skl-esk0212','skl-esk0213','skl-esk1001','skl-esk1101','skl-esk1211',
   'skl-m5','skl-m8'
 );

DELETE FROM inventory
 WHERE product_id IN (
   'skl-esk0001','skl-esk0002','skl-esk0003','skl-esk0101','skl-esk0102','skl-esk0103',
   'skl-esk0211','skl-esk0212','skl-esk0213','skl-esk1001','skl-esk1101','skl-esk1211',
   'skl-m5','skl-m8'
 );

DELETE FROM product_overrides
 WHERE product_id IN (
   'skl-esk0001','skl-esk0002','skl-esk0003','skl-esk0101','skl-esk0102','skl-esk0103',
   'skl-esk0211','skl-esk0212','skl-esk0213','skl-esk1001','skl-esk1101','skl-esk1211',
   'skl-m5','skl-m8'
 );
