-- Bring built-in products up to parity with custom products in the admin
-- editor. The Bonny / Dikdörtgen modal lets the admin edit Set Bilgileri
-- (volume + set size) and Badges (Yeni, Öne çıkar). To offer the same modal
-- shape for built-in products, the override row needs the same fields.
--
-- NULL on any column means "fall back to the static catalog default" — same
-- semantics as the existing name/price/desc overrides.

ALTER TABLE product_overrides
  ADD COLUMN volume_label TEXT,
  ADD COLUMN set_size     INTEGER CHECK (set_size IS NULL OR set_size > 0),
  ADD COLUMN badges       JSONB;
