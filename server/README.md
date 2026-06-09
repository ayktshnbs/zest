# Zest Home — Backend

Authentication, user management, orders, and payments service for the
Zest Home storefront. Built on **Node.js 20+ / Express / PostgreSQL**.

## Layout

```
server/
├── server.js               # entrypoint, graceful shutdown
├── app.js                  # express app factory
├── config.js               # validated env config (zod)
├── controllers/            # request handlers
├── routes/                 # Express routers (mounted under /api)
├── middleware/             # auth, CSRF, rate-limit, validate, error handler
├── services/               # JWT, email (Resend), Google OAuth, Creem, audit
├── models/                 # thin SQL query layer over node-postgres
├── database/
│   ├── pool.js             # pg Pool
│   ├── migrate.js          # idempotent SQL migration runner
│   └── migrations/         # *.sql, applied in filename order
└── utils/                  # logger, errors, validation schemas, tokens, cookies
```

## Setup

```bash
cd server
cp .env.example .env        # fill in real values
npm install
npm run migrate             # apply pending migrations
npm run dev                 # node --watch
```

Generate strong secrets:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Set this for each of `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CSRF_SECRET`.

## API surface

All routes are under `/api`. Responses are JSON. Authentication is via
`access_token` HTTP-only cookie; refresh via `refresh_token` HTTP-only
cookie (scoped to `/api/auth/refresh`).

### Auth

| Method | Path                            | Body                                   |
| ------ | ------------------------------- | -------------------------------------- |
| POST   | `/api/auth/register`            | `{ name, email, password }`            |
| POST   | `/api/auth/login`               | `{ email, password }`                  |
| POST   | `/api/auth/logout`              | —                                      |
| POST   | `/api/auth/refresh`             | — (uses refresh cookie)                |
| POST   | `/api/auth/forgot-password`     | `{ email }`                            |
| POST   | `/api/auth/reset-password`      | `{ token, password }`                  |
| POST   | `/api/auth/google`              | `{ id_token }`                         |
| GET    | `/api/auth/csrf`                | — (returns CSRF token cookie + header) |

### Users (auth required)

| Method | Path                            | Body                                |
| ------ | ------------------------------- | ----------------------------------- |
| GET    | `/api/users/me`                 | —                                   |
| PATCH  | `/api/users/me`                 | `{ name?, email? }`                 |
| POST   | `/api/users/me/change-password` | `{ currentPassword, newPassword }`  |

### Orders + payments (auth required)

| Method | Path                                | Body                                          |
| ------ | ----------------------------------- | --------------------------------------------- |
| GET    | `/api/orders`                       | — (history)                                   |
| GET    | `/api/orders/:id`                   | —                                             |
| POST   | `/api/orders`                       | `{ items: [...], shippingAddress, total }`    |
| POST   | `/api/payments/checkout`            | `{ orderId }`  → returns Creem checkout URL   |

### Webhooks (no auth — signed by Creem)

| Method | Path                  |
| ------ | --------------------- |
| POST   | `/api/webhooks/creem` |

## Security

- Passwords: bcrypt (rounds configurable via `BCRYPT_ROUNDS`).
- JWT access tokens in `httpOnly`, `SameSite=Lax`, `Secure` (prod) cookies.
- Refresh tokens scoped to `/api/auth/refresh` with separate JWT secret.
- CSRF via double-submit cookie pattern (`csrf-csrf`). Frontend must read
  the `csrf` cookie and echo it as `x-csrf-token` for state-changing requests.
- Rate limiting global (300 / 15 min default) + tighter on auth endpoints.
- Helmet for HTTP headers.
- All inputs validated with zod schemas; controllers receive `req.validated`.
- Parametrized SQL only (no string interpolation).
- Webhooks idempotent via `webhook_events` table + Creem signature check.
- Audit log on auth events and sensitive mutations.

## Database migrations

Add a new SQL file to `database/migrations/` named `NNN_description.sql`.
Numbering controls execution order. `npm run migrate` applies any not
already recorded in `schema_migrations`.

## Frontend integration sketch

```ts
// 1. fetch CSRF token once on app boot
await fetch('/api/auth/csrf', { credentials: 'include' });
// `csrf` cookie is now set. Read it (it's not httpOnly).

// 2. login
await fetch('/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'content-type': 'application/json',
    'x-csrf-token': getCookie('csrf'),
  },
  body: JSON.stringify({ email, password }),
});
```
