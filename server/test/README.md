# Payment integration tests

These run against a **real PostgreSQL** database and apply the real
`database/migrations/*.sql`. That is deliberate: the behaviour under test is
expressed in SQL — the `succeeded → failed` guard, `SELECT … FOR UPDATE`
locking, and the expiry sweep's `EXISTS (payments WHERE status='succeeded')`
arm — so a mock or in-memory shim would assert nothing.

No test framework is added. Node 20 (already required by `engines`) ships a
test runner, so the suite is `node --test` plus `node:assert/strict`.

> **Node 22+ note.** `node --test somedir/` no longer works — positional
> arguments are treated as file paths/glob patterns, so a bare directory fails
> with `MODULE_NOT_FOUND`. The `test` script therefore passes an explicit glob,
> `node --test "test/**/*.test.js"`. That glob is also what keeps `helpers/*.js`
> from being picked up and reported as (empty) test files.

> **`--test-concurrency=1` is required, not a preference.** Node runs test
> FILES in parallel by default, and every file here shares one database and
> `TRUNCATE`s it in `beforeEach`. Run them concurrently and one file wipes
> another's fixtures mid-test; `TRUNCATE`'s ACCESS EXCLUSIVE lock then stalls
> the other process until its subtests are cancelled
> (`test did not finish before its parent`). Serial execution is what makes the
> shared-database design safe. If you ever want parallel files, give each one
> its own database or schema instead of removing this flag.

## Running

You need a **throwaway** database. The suite `TRUNCATE`s between tests.

```bash
createdb zest_test
```

```bash
cd server && npm ci
```

```bash
cd server && TEST_DATABASE_URL="postgres://postgres:postgres@localhost:5432/zest_test" npm test
```

On Windows PowerShell:

```bash
cd server; $env:TEST_DATABASE_URL="postgres://postgres:postgres@localhost:5432/zest_test"; npm test
```

One file at a time:

```bash
cd server && TEST_DATABASE_URL="postgres://postgres:postgres@localhost:5432/zest_test" node --test test/expiry-evidence.test.js
```

`TEST_DATABASE_URL` is the only variable you supply. `test/helpers/env.js`
fills in the rest of the config with placeholders so `config.js` validates, and
sets the PayTR merchant key/salt that `helpers/callback.js` signs with — no
`.env` file is read and no network call is made.

## Coverage

| File | Cases |
|---|---|
| `settlement.test.js` | success→failure · mismatch-success→failure · failure→success · duplicate success · duplicate failure · new-format A1/A2 cross-check · missing-row classification |
| `expiry-evidence.test.js` | the durable-evidence regression, plus a counter-factual proving the assertion is load-bearing |

Every test asserts the resulting **database state** — order status,
`stock_restored_at`, `inventory.stock`, payment row status, `webhook_events`
rows and the audit/review records — not the handler's return value.
