-- Strip the storefront placeholder from stored product galleries
-- ---------------------------------------------------------------------------
-- The admin editor used to seed a built-in product's gallery from
-- `Product.imageUrl`, which is `images[0] ?? "/placeholder-product.svg"`. For
-- a product with no real photos that put the grey placeholder at index 0, so
-- every photo the admin uploaded landed at index 1 and the catalog kept
-- rendering the placeholder as the cover.
--
-- Remove the placeholder from every stored gallery. The real uploads keep
-- their relative order, so the former "2nd" photo becomes the cover. A gallery
-- that held ONLY the placeholder collapses to NULL (= "use the static images"),
-- matching what ProductOverrideModel.set writes for an empty list.
--
-- `custom_products.image_urls` is NOT NULL DEFAULT '{}', so it collapses to
-- '{}' instead; the storefront already treats '{}' as "no photos".
--
-- Idempotent: rows without the placeholder are untouched.

UPDATE product_overrides
   SET image_urls = NULLIF(array_remove(image_urls, '/placeholder-product.svg'), '{}'::text[])
 WHERE image_urls IS NOT NULL
   AND '/placeholder-product.svg' = ANY (image_urls);

UPDATE custom_products
   SET image_urls = array_remove(image_urls, '/placeholder-product.svg')
 WHERE '/placeholder-product.svg' = ANY (image_urls);
