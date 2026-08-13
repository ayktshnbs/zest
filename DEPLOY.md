# Deploying Zest Home

Architecture: **Vercel** (Next.js storefront + admin) → proxies `/api/*` to the
**Express API on Render** → **Neon** Postgres. The browser only ever talks to the
Vercel domain, so auth cookies stay first-party (login works everywhere, incl. iOS).

> ⚠️ Email verification, Google sign-in, and payments use **placeholder keys** —
> registration, login, orders, and admin work, but no emails send and no real
> charges happen until you add real Resend / Google / PayTR keys.

---

## 1. Backend → Render (free)

1. [render.com](https://render.com) → **New → Blueprint** → connect the GitHub repo
   `ayktshnbs/zest`. Render reads `render.yaml` and creates the `zest-api` service
   (rootDir `server`, `node server.js`, health check `/api/health`).
2. When prompted, fill the `sync: false` env vars:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | your Neon connection string (the `postgresql://…neon.tech/neondb?sslmode=require` one) |
   | `JWT_ACCESS_SECRET` | *(from chat — fresh 96-char hex)* |
   | `JWT_REFRESH_SECRET` | *(from chat)* |
   | `CSRF_SECRET` | *(from chat)* |
   | `ALLOWED_ORIGINS` | `https://YOUR-APP.vercel.app` |
   | `FRONTEND_URL` | `https://YOUR-APP.vercel.app` |
   | `PASSWORD_RESET_URL` | `https://YOUR-APP.vercel.app/sifre-sifirla` |
   | `LOGIN_URL` | `https://YOUR-APP.vercel.app/giris` |
   | `EMAIL_VERIFICATION_URL` | `https://YOUR-APP.vercel.app/e-posta-dogrula` |
   | `RESEND_API_KEY` | `re_dev_dummy_key` *(replace with a real key for emails)* |
   | `EMAIL_FROM` | `Zest Home <no-reply@example.com>` |
   | `GOOGLE_OAUTH_CLIENT_ID` | `dummy.apps.googleusercontent.com` |
   | `PAYTR_MERCHANT_ID` | `paytr_merchant_id_dummy` |
   | `PAYTR_MERCHANT_KEY` | `paytr_merchant_key_dummy` |
   | `PAYTR_MERCHANT_SALT` | `paytr_merchant_salt_dummy` |
   | `PAYTR_SUCCESS_URL` | `https://YOUR-APP.vercel.app/odeme/basarili` |
   | `PAYTR_FAIL_URL` | `https://YOUR-APP.vercel.app/odeme/basarisiz` |

   (`NODE_ENV`, `COOKIE_SECURE=true`, `PG_SSL=true`, TTLs, `PAYTR_TEST_MODE` are preset in `render.yaml`.)
3. Deploy. Migrations are already applied to Neon, so the API is ready once it boots.
   Note the service URL, e.g. `https://zest-api.onrender.com`.
   - Free tier sleeps after ~15 min idle; the first request then takes ~30–50s.

## 2. Frontend → Vercel

1. Vercel project → **Settings → Environment Variables** → add
   `BACKEND_URL = https://zest-api.onrender.com` (Production). Leave
   `NEXT_PUBLIC_API_URL` unset (the app uses the same-origin `/api` proxy).
2. Deploy: `vercel --prod` (or push to `main` if the project auto-deploys from GitHub).
3. Note the production URL, e.g. `https://kitchen-e-commerce.vercel.app`.

## 3. Reconcile URLs

If your real Vercel URL differs from what you put in step 1, update the Render env
vars (`ALLOWED_ORIGINS`, `FRONTEND_URL`, the `*_URL`s) to the real Vercel URL and
redeploy the Render service.

## 4. Make yourself admin (once registered on the live site)

```sql
UPDATE users SET role = 'admin' WHERE email = 'ayktshnbs@gmail.com';
```

---

## Local development (unchanged)

```bash
cd server && npm start      # API on :4000
npm run dev                 # storefront on :3000
```
Locally the app talks to `http://localhost:4000` directly (no proxy); in production
it uses the `/api` proxy. After product price/id/stock edits in code: re-run
`npm run build:catalog` then `npm run seed:inventory`.
