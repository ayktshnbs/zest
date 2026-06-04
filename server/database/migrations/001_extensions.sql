-- Required Postgres extensions.
-- pgcrypto: gen_random_uuid()
-- citext:   case-insensitive text (used for email columns)

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
