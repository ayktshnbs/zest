-- Add an optional phone number to the user's own profile.
-- ---------------------------------------------------------------------------
-- Nullable and additive: every existing row gets NULL, no existing query or
-- code path is affected. Used by "Profil Bilgilerim" and, going forward, can
-- prefill checkout's contact step for a signed-in shopper.

ALTER TABLE users ADD COLUMN phone TEXT;
