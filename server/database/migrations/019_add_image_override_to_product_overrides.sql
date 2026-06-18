-- Admin-editable cover image gallery for built-in products.
-- ---------------------------------------------------------------------------
-- Lets the admin add/remove photos for a built-in product from the storefront
-- panel without touching lib/products.ts. NULL or empty means "use the static
-- catalog images on disk". When variants exist, variants own their own image
-- gallery — this column is the parent cover used in product cards.

ALTER TABLE product_overrides
  ADD COLUMN image_urls TEXT[];
