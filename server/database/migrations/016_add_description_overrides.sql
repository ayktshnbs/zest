-- Description overrides for built-in catalog products.
-- Lets admins edit a product's short + long description from /admin/products,
-- without touching lib/products.ts. A NULL value means "use the code default".

ALTER TABLE product_overrides
  ADD COLUMN short_description TEXT,
  ADD COLUMN description       TEXT;
