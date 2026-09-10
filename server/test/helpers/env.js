// Test environment bootstrap.
//
// MUST be imported (for side effects) before anything that pulls in
// ../config.js — config validates ~20 env vars at module load and calls
// process.exit(1) if any is missing, and pool.js imports it transitively.
//
// Only TEST_DATABASE_URL is real. Everything else is a syntactically valid
// placeholder chosen to satisfy the zod schema; no test performs network I/O.
// PAYTR_MERCHANT_KEY / _SALT are the values the callback signing helper uses,
// so they must match what the handler verifies against — that is the whole
// point of setting them here rather than reading a developer's .env.

const set = (key, value) => {
  if (!process.env[key]) process.env[key] = value;
};

if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    "TEST_DATABASE_URL is required. Point it at a THROWAWAY database — the " +
      "suite truncates tables between tests.\n" +
      '  e.g. TEST_DATABASE_URL="postgres://postgres:postgres@localhost:5432/zest_test"',
  );
}

// pool.js reads DATABASE_URL; route it at the test database.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

set("NODE_ENV", "test");
set("PG_SSL", "false");
set("LOG_LEVEL", "silent");

set("JWT_ACCESS_SECRET", "test-access-secret-least-32-characters-long-xxxx");
set("JWT_REFRESH_SECRET", "test-refresh-secret-least-32-characters-long-xxx");
set("CSRF_SECRET", "test-csrf-secret-at-least-32-characters-long-xxxx");

set("FRONTEND_URL", "http://localhost:3000");
set("PASSWORD_RESET_URL", "http://localhost:3000/sifre-sifirla");
set("LOGIN_URL", "http://localhost:3000/giris");
set("EMAIL_VERIFICATION_URL", "http://localhost:3000/e-posta-dogrula");

set("RESEND_API_KEY", "re_test_key");
set("EMAIL_FROM", "Zest Test <no-reply@example.test>");
set("GOOGLE_OAUTH_CLIENT_ID", "test.apps.googleusercontent.com");

// The signing helper mirrors these — see helpers/callback.js.
set("PAYTR_MERCHANT_ID", "test_merchant_id");
set("PAYTR_MERCHANT_KEY", "test_merchant_key");
set("PAYTR_MERCHANT_SALT", "test_merchant_salt");
set("PAYTR_SUCCESS_URL", "http://localhost:3000/odeme/basarili");
set("PAYTR_FAIL_URL", "http://localhost:3000/odeme/basarisiz");
set("PAYTR_TEST_MODE", "1");
