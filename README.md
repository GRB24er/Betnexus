# BetNexus

Sports & casino betting platform built on Next.js 16, MongoDB, and Paystack.

## Stack

- **App:** Next.js 16 (App Router, Turbopack)
- **Auth:** JWT in HttpOnly cookies, edge-verified via `src/proxy.ts`
- **DB:** MongoDB / Mongoose
- **Cache & rate limit:** Redis (optional — falls back to permissive mode)
- **Payments:** Paystack (mobile money, card, bank transfer) + manual BTC
- **Odds & live data:** The Odds API + API-Football
- **Email:** Nodemailer (any SMTP)

## Requirements

- Node.js >= 20 (see `.nvmrc`)
- MongoDB 6+
- Redis (optional but recommended for rate limiting)

## Setup

```bash
nvm use            # picks Node 20 from .nvmrc
npm install
cp .env.example .env.local   # then fill in real values
npm run dev
```

The app validates env vars on first request via `src/lib/env.ts`. Missing or
weak values fail fast with a clear error rather than a silent misconfiguration.

### Required environment variables

| Variable              | Required           | Notes                                                |
| --------------------- | ------------------ | ---------------------------------------------------- |
| `MONGODB_URI`         | Always             | `mongodb://...`                                      |
| `JWT_SECRET`          | Always             | Min 32 chars. `openssl rand -hex 32`                 |
| `ADMIN_SETUP_SECRET`  | Always             | Min 32 chars. Required to call `/api/admin/setup`    |
| `NEXT_PUBLIC_APP_URL` | Production         | Public origin, used in Paystack callbacks & emails   |
| `PAYSTACK_SECRET_KEY` | Production         | Server-side Paystack key                             |
| `REDIS_URL`           | Recommended        | Without it, rate limiting is a no-op                 |
| `SMTP_*`              | Recommended        | Without it, emails log to stdout                     |
| `ODDS_API_KEY`        | Optional           | Live odds fall back to empty arrays without it       |
| `BTC_DEPOSIT_ADDRESS` | Optional           | BTC deposit endpoint returns 503 if unset            |

See `.env.example` for the full list.

## Bootstrap an admin

```bash
# Local CLI — interactive
npm run create-admin

# Or via API (requires ADMIN_SETUP_SECRET in env on the server)
curl -X POST $APP_URL/api/admin/setup \
  -H 'content-type: application/json' \
  -d '{"firstName":"…","lastName":"…","email":"…","password":"…","secret":"<ADMIN_SETUP_SECRET>"}'
```

## Scripts

```bash
npm run dev          # Next.js dev server
npm run build        # production build
npm run start        # serve the production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run verify       # lint + typecheck + build (run before pushing)
npm run create-admin # interactive admin bootstrap
```

## Health check

`GET /api/health` returns `200 { status: "ok" }` when MongoDB and Redis (if
configured) are reachable, or `503 { status: "degraded" }` with per-check
diagnostics. Wire this to your load balancer / uptime monitor.

## Architecture notes

- **Edge auth (`src/proxy.ts`):** The Next.js 16 proxy file (renamed from
  `middleware`) verifies the session JWT before requests reach app code.
  Fails closed if `JWT_SECRET` is missing.
- **Atomic financial ops:** Bet placement, deposits, withdrawals, cashouts,
  and promo redemptions all use `findOneAndUpdate` with state guards to
  prevent race conditions under concurrent load.
- **Webhook idempotency:** `/api/paystack/webhook` uses constant-time
  signature comparison and atomic state transitions, so duplicate Paystack
  retries cannot double-credit a deposit or double-refund a transfer.
- **KYC uploads:** Currently written to local disk under `uploads/kyc`.
  This is **ephemeral on serverless platforms** — move to S3/R2 before
  hosting on Vercel.

## Production checklist

Before deploying:

1. Generate fresh secrets for `JWT_SECRET` and `ADMIN_SETUP_SECRET`.
2. Set `NODE_ENV=production` and `NEXT_PUBLIC_APP_URL` to your real origin.
3. Configure Paystack webhook URL: `<APP_URL>/api/paystack/webhook`.
4. Replace local KYC storage with S3-compatible object storage.
5. Tighten the CSP in `next.config.ts` (drop `'unsafe-inline'` / `'unsafe-eval'`).
6. Wire `/api/health` to your platform's healthcheck probe.
7. Configure MongoDB backups.
8. Add an error tracker (Sentry/Rollbar) — the app currently logs to stdout only.
