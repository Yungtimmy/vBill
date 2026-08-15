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
- Merchant dashboard, invoices, customers, settings
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

- PostgreSQL (`DATABASE_URL`)
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
  ├─ Merchant: /dashboard  /invoices  /customers  /settings
  └─ API: Zod-validated route handlers

PostgreSQL + Prisma
  invoices, payments, merchants, audit, rate limits

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
- Prisma 6 + PostgreSQL
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
# fill in DATABASE_URL, Privy, RPC, and demo or production chain vars

docker compose up -d        # local Postgres
npx prisma migrate deploy
npm run dev
```

Open http://localhost:3000

`GET /api/health` reports which integrations are configured (no secrets).

## Environment variables

See `.env.example`. Secrets never use the `NEXT_PUBLIC_` prefix.

| Name | Role |
| --- | --- |
| `DATABASE_URL` | PostgreSQL |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app id (public) |
| `PRIVY_APP_SECRET` | Privy server secret |
| `RPC_URL` | Server-only Polygon (or demo) RPC |
| `VERSE_NETWORK_MODE` | `demo` or `production` |
| `CRON_SECRET` | Bearer token for `/api/cron/verify-payments` |
| `DEMO_*` | Required in demo mode: real testnet chain + real ERC-20 |
| `VERSE_ANALYTICS_ENDPOINT` / `VERSE_ANALYTICS_KEY` | Optional official Verse analytics |

## Privy setup

1. Create an app at [dashboard.privy.io](https://dashboard.privy.io)
2. Enable email login and embedded Ethereum wallets
3. Allow your app URL
4. Put the app ID in `NEXT_PUBLIC_PRIVY_APP_ID` and the secret in `PRIVY_APP_SECRET`
5. Optional: copy the JWT verification key to `PRIVY_VERIFICATION_KEY`

Do not claim a recovery method that Privy is not configured to provide.

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

Vercel + managed PostgreSQL + a dedicated RPC provider.

1. Set all production env vars
2. Run `prisma migrate deploy`
3. Set `CRON_SECRET` so Vercel Cron can call `/api/cron/verify-payments` every minute
4. Confirm `APP_URL` and Privy allowed origins

## Security notes

- Bearer-token auth. Identity comes from Privy’s verified access token, never from a client-supplied user id.
- CSRF tokens are not used (no cookie session). Origin is checked on state-changing routes when `APP_URL` is set.
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
- [ ] Privy production app, HTTPS, HSTS
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
