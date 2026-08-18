# VerseBill

Invoices that prove payment on-chain.

VerseBill is a non-custodial invoicing app for the **VERSE** token on **Polygon PoS**. Merchants create invoices and share a payment link. Customers pay VERSE from an embedded or connected wallet. The backend independently verifies the ERC-20 `Transfer` against Polygon before an invoice is marked paid.

> VerseBill does not ask anyone to blindly trust our database.

Funds move:

```
Customer wallet  →  Merchant wallet
```

VerseBill never holds customer funds and never stores private keys.

## Status legend

| Label | Meaning |
| --- | --- |
| **Implemented** | In this repository and ready to run once configured |
| **Requires configuration** | Code is present; operator must supply credentials or infrastructure |
| **Future** | Intentionally not in the MVP |

## Features

**Implemented**

- Email OTP + optional external wallet via Privy
- Embedded EVM wallet on login (no seed phrase prompt)
- Merchant dashboard, invoices, payments, settings
- Human invoice numbers (`VB-1001`) plus unguessable public IDs
- Public payment page with destination, token, network, amount always visible
- QR code of the payment URL (not a raw address)
- Share via copy / WhatsApp / Telegram / X / email
- Public on-chain proof page with explorer links
- ERC-20 `Transfer` verification against the trusted VERSE contract
- Underpay / overpay / wrong token / wrong recipient / revert handling
- Idempotent payment records (`chainId + txHash` unique)
- Server-side authz, Zod validation, rate limits, audit log, security headers
- Automated unit tests for money math, status machine, and verification rules

**Requires configuration**

- Supabase Postgres (`DATABASE_URL` + `DIRECT_URL`)
- Privy app ID + secret
- Server-side RPC URL
- Demo-mode test token/chain **or** production mode (`VERSE_NETWORK_MODE=production`)
- Vercel Cron secret for confirmation retries
- Optional Resend for outbound email
- Verse App Analytics endpoint + key (no official public SDK was available)

**Future**

- Automatic refunds
- Invoice PDFs
- Redis / dedicated queue
- Admin console
- Polygon checkpoint finality (MVP uses configurable confirmations)

## Architecture

```
Next.js App Router
  ├─ Public: /  /pay/[publicId]  /verify/[publicId]
  ├─ Merchant: /dashboard  /invoices  /payments  /settings
  └─ API: Zod-validated route handlers

Supabase Postgres + Prisma
  User, Merchant, Invoice, Payment, AuditLog

Privy
  identity + embedded/external wallets (client)
  verifyAccessToken via @privy-io/node (server)

viem
  server RPC for receipts + Transfer logs
  client walletClient.writeContract(transfer) using invoice fields only
```

The frontend cannot set `invoice.status = PAID`. Only `PaymentVerificationService` (`src/server/verify-payment.ts`) can, after `evaluatePayment` (`src/lib/verify-rules.ts`) accepts the receipt.

## Tech stack

- Next.js 15 App Router, React 19, TypeScript
- Tailwind CSS v4
- Prisma 6 + Supabase PostgreSQL
- Zod, viem
- Privy (`@privy-io/react-auth`, `@privy-io/node`)
- Vitest

## Confirmed VERSE configuration (Buildathon)

Official Bitcoin.com support lists the Polygon VERSE (fxVERSE) contract as:

```
Network:     Polygon PoS
Chain ID:    137
Token:       0xc708d6f2153933daa50b2d0758955be0a93a8fec
Decimals:    18
Explorer:    https://polygonscan.com
Gas token:   POL
```

Production mode refuses any other chain ID or token address. Clients cannot override them.

Ethereum VERSE (`0x249ca82617ec3dfb2589c4c17ab7ec9765350a18`) is a different contract and is not accepted as payment.

## Local setup

```bash
cp .env.example .env.local
# fill in DATABASE_URL, Privy, RPC

npx prisma db push
npm run dev
```

The database is **Supabase PostgreSQL**. If `db.*.supabase.co` has no IPv4 address, use the region pooler (`aws-0-<region>.pooler.supabase.com`) for both `DATABASE_URL` (port 6543) and `DIRECT_URL` (port 5432). Then:

```bash
npx prisma migrate deploy
```

Open http://localhost:3000

`GET /api/health` reports which integrations are configured (no secrets).

## Environment variables

See `.env.example`. Secrets never use the `NEXT_PUBLIC_` prefix.

| Name | Role |
| --- | --- |
| `DATABASE_URL` | Supabase transaction pooler (server) |
| `DIRECT_URL` | Supabase session/direct URL (migrations) |
| `POLYGON_RPC_URL` | Server-only Alchemy Polygon RPC |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app id (public) |
| `PRIVY_APP_SECRET` | Privy server secret |
| `RPC_URL` | Fallback if `POLYGON_RPC_URL` is unset |
| `VERSE_NETWORK_MODE` | `demo` or `production` |
| `CRON_SECRET` | Bearer token for `/api/cron/verify-payments` |
| `DEMO_*` | Required in demo mode: real testnet chain + real ERC-20 |
| `VERSE_ANALYTICS_ENDPOINT` / `VERSE_ANALYTICS_KEY` | Optional official Verse analytics |

## Privy setup

Code:

1. Create an app at [dashboard.privy.io](https://dashboard.privy.io)
2. Enable **email** and **wallet** login. Do not enable SMS.
3. Enable embedded Ethereum wallets (`createOnLogin: users-without-wallets` is already set in code)
4. Put the app ID in `NEXT_PUBLIC_PRIVY_APP_ID` and the secret in `PRIVY_APP_SECRET`
5. Copy the JWT verification key to `PRIVY_VERIFICATION_KEY` (PEM, `\n` escaped). This is a public key, not a private key.

The server verifies tokens with Privy’s official `@privy-io/node` `verifyAccessToken`. Identity is `user_id` from that verification only. The API accepts `Authorization: Bearer` and, when you enable HttpOnly cookies, the official `privy-token` cookie.

Dashboard (required before production — from [Privy security checklist](https://docs.privy.io/security/implementation-guide/security-checklist) and [allowed domains](https://docs.privy.io/recipes/dashboard/allowed-domains)):

1. **Allowed origins** — `https://your-domain.com` and `https://www.your-domain.com`. For local work use a **development** app ID with `http://localhost:3000`. Never allow `*.vercel.app`.
2. **Separate app IDs** for development and production. Do not use the production ID on localhost once cookies are on.
3. **HttpOnly cookies** — production only, after DNS verification on your real domain. Keep SameSite=Strict unless you have a reason for Lax.
4. **MFA** — enable passkey or authenticator MFA. Email OTP is a delegated login; account access is wallet access.
5. **Disable SMS**.
6. **Session duration** — shorten from the 30-day default if invoices will move real value.
7. Remove test/preview domains from the production app.

CSP follows [Privy’s official policy](https://docs.privy.io/security/implementation-guide/content-security-policy) plus a per-request nonce so Next.js does not need `unsafe-inline` scripts. `unsafe-eval` is development-only.

Do not claim a recovery method that Privy is not configured to provide. Never paste `PRIVY_APP_SECRET` into chat, git, or tickets. If it leaks, rotate it in the dashboard immediately.

## Blockchain setup

**Demo / testnet first.** Set `VERSE_NETWORK_MODE=demo` and supply a real test ERC-20 + chain (for example Polygon Amoy) plus `DEMO_RPC_URL`. The UI banner says Demo / Testnet. No mocked transaction hashes.

**Production / mainnet.** Set `VERSE_NETWORK_MODE=production` and `NEXT_PUBLIC_NETWORK_MODE=production`. Verification is locked to chain `137` and token `0xc708d6f2153933daa50b2d0758955be0a93a8fec`. Customers need POL for gas. VERSE does not pay gas.

Confirmations default to 30 on Polygon (probabilistic). This is not Ethereum-checkpoint finality.

## Tests

```bash
npm test
npm run typecheck
npm run lint
```

## Deployment

Vercel + Supabase Postgres + a dedicated Polygon RPC.

1. Set all production env vars
2. Run `prisma migrate deploy`
3. Set `CRON_SECRET` so Vercel Cron can call `/api/cron/verify-payments` every minute
4. Confirm `APP_URL` and Privy allowed origins

## Security notes

- Auth identity comes from Privy’s verified access token, never from a client-supplied user id. Bearer header first; official `privy-token` cookie accepted for HttpOnly mode.
- CSRF tokens are not used for Bearer APIs. Origin is checked on state-changing routes when `APP_URL` is set. Do not enable SameSite=Lax cookies unless those mutation routes stay origin-checked.
- CSP, `X-Frame-Options`, HSTS (production), and `nosniff` are set in middleware. No `Access-Control-Allow-Origin: *`.
- Payment destination / token / chain / amount are stamped from server config at invoice creation and are immutable after publish.
- Duplicate `txHash` on the same chain cannot pay two invoices.
- RPC failure never marks an invoice paid.
- Webhooks (if configured) are HMAC-verified and cannot set PAID.
- `Work.md` is gitignored and must not contain secrets.

## Known limitations

- Verse App Analytics has no public official SDK in the docs we could verify. Events are stored locally; outbound send waits for an official endpoint.
- Rate limiting is database-backed, not a WAF.
- Confirmations are probabilistic.
- No automatic refunds.
- Demo mode needs an operator-supplied test token. There is no official VERSE testnet token in public docs.

## Production checklist

- [ ] Official VERSE contract and chain ID re-checked on Bitcoin.com support + PolygonScan
- [ ] `VERSE_NETWORK_MODE=production`
- [ ] Privy production app: allowed origins, no SMS, MFA, HttpOnly cookies on the real domain, HTTPS, HSTS
- [ ] Privy app secret rotated if it was ever pasted into chat or committed
- [ ] Restricted database user, encryption at rest (provider)
- [ ] RPC credentials server-only
- [ ] Security tests green
- [ ] End-to-end testnet payment before enabling mainnet
- [ ] Verse Hub registration (operator)
- [ ] Independent review of money-moving code

## Buildathon extras (operator, not code)

- Live MVP URL
- 3–5 minute demo video
- Project X account
- Team introduction video
- Wallet address
- Verse Hub registration
