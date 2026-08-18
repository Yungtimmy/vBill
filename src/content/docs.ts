/**
 * VerseBill documentation content.
 *
 * All content is authored here as data so the docs render consistently and
 * navigation (sidebar, prev/next) can be derived from a single source of truth.
 * The content describes the *actual* implementation — do not add endpoints,
 * env vars, or behavior that does not exist in the code.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "list"; items: string[] }
  | { type: "steps"; items: string[] }
  | { type: "check"; items: string[] }
  | { type: "code"; lang?: string; title?: string; code: string }
  | { type: "callout"; tone?: "info" | "warn"; text: string };

export type DocItem = { slug: string; title: string };
export type DocSection = { title: string; items: DocItem[] };
export type DocPage = { title: string; description: string; blocks: Block[] };

export const DOC_SECTIONS: DocSection[] = [
  {
    title: "Overview",
    items: [
      { slug: "introduction", title: "Introduction" },
      { slug: "how-verse-bill-works", title: "How VerseBill Works" },
    ],
  },
  {
    title: "Product",
    items: [
      { slug: "invoices", title: "Invoices" },
      { slug: "payments", title: "Payments" },
      { slug: "payment-verification", title: "Payment Verification" },
      { slug: "merchant-flow", title: "Merchant Flow" },
      { slug: "customer-flow", title: "Customer Flow" },
    ],
  },
  {
    title: "Technical",
    items: [
      { slug: "architecture", title: "Architecture" },
      { slug: "authentication", title: "Authentication" },
      { slug: "database", title: "Database" },
      { slug: "blockchain-integration", title: "Blockchain Integration" },
      { slug: "on-chain-verification", title: "On-chain Verification" },
      { slug: "api-overview", title: "API Overview" },
    ],
  },
  {
    title: "Security",
    items: [
      { slug: "security-model", title: "Security Model" },
      { slug: "payment-safety", title: "Payment Safety" },
      { slug: "input-validation", title: "Input Validation" },
      { slug: "authentication-authorization", title: "Authentication & Authorization" },
      { slug: "rate-limiting", title: "Rate Limiting" },
      { slug: "idempotency", title: "Idempotency" },
    ],
  },
  {
    title: "Deployment",
    items: [
      { slug: "environment-variables", title: "Environment Variables" },
      { slug: "local-development", title: "Local Development" },
      { slug: "production-deployment", title: "Production Deployment" },
    ],
  },
  {
    title: "Buildathon",
    items: [
      { slug: "verse-integration", title: "Verse Integration" },
      { slug: "verse-app-analytics", title: "Verse App Analytics" },
      { slug: "verse-hub", title: "Verse Hub" },
      { slug: "polygon", title: "Polygon" },
      { slug: "verse-payment-support", title: "VERSE Payment Support" },
    ],
  },
];

const FLAT = DOC_SECTIONS.flatMap((s) => s.items);

export function flatDocs(): DocItem[] {
  return FLAT;
}

export function neighbors(slug: string): { prev?: DocItem; next?: DocItem } {
  const i = FLAT.findIndex((d) => d.slug === slug);
  if (i === -1) return {};
  return { prev: FLAT[i - 1], next: FLAT[i + 1] };
}

export function sectionOf(slug: string): string | undefined {
  return DOC_SECTIONS.find((s) => s.items.some((d) => d.slug === slug))?.title;
}

export const DOC_PAGES: Record<string, DocPage> = {
  introduction: {
    title: "Introduction",
    description: "What VerseBill is and the problem it solves.",
    blocks: [
      {
        type: "p",
        text: "VerseBill is an on-chain invoicing and payment application designed to make crypto payments easier for merchants and customers. It lets a merchant create an invoice, share a payment link, and accept VERSE on Polygon — with the payment independently verified against the blockchain before the invoice is marked paid.",
      },
      { type: "h2", text: "The problem" },
      {
        type: "p",
        text: "Traditional crypto payments are hard to track against an invoice. When a customer sends a token, the merchant still has to figure out whether the correct token, the correct amount, the correct recipient, and the correct transaction were actually used — across every invoice, manually.",
      },
      { type: "h2", text: "The solution" },
      {
        type: "steps",
        items: [
          "Invoice creation",
          "Payment request",
          "Customer payment",
          "On-chain verification",
          "Invoice status update",
          "Verifiable payment record",
        ],
      },
      {
        type: "callout",
        tone: "info",
        text: "VerseBill verifies payment details against on-chain transaction data before marking an invoice as paid. The frontend and wallet UI are never trusted to decide that a payment succeeded.",
      },
    ],
  },

  "how-verse-bill-works": {
    title: "How VerseBill Works",
    description: "The end-to-end flow, from invoice to verified payment.",
    blocks: [
      {
        type: "p",
        text: "Every invoice in VerseBill moves through a single, verifiable pipeline. The key property is that the invoice only becomes paid after the server has confirmed the transaction on-chain.",
      },
      {
        type: "steps",
        items: [
          "Merchant creates an invoice",
          "VerseBill generates a payment request",
          "Customer reviews the payment details",
          "Customer connects/signs through their wallet",
          "Transaction is submitted on Polygon",
          "VerseBill verifies the transaction on-chain",
          "Invoice is marked as paid only after successful verification",
          "Merchant receives a verifiable payment record",
        ],
      },
      {
        type: "callout",
        tone: "info",
        text: "An invoice transitions to PAID only after successful server-side verification. A wallet confirmation or a client-side callback is never sufficient.",
      },
    ],
  },

  invoices: {
    title: "Invoices",
    description: "How invoices are modeled and their lifecycle.",
    blocks: [
      {
        type: "p",
        text: "An invoice is the core record in VerseBill. It captures who is being billed, what is being charged, and where payment should be sent. Each invoice is identified by a public ID used in the payment link and a human-friendly invoice number scoped to the merchant.",
      },
      { type: "h2", text: "What an invoice contains" },
      {
        type: "list",
        items: [
          "Customer name and optional email",
          "Line items (description, quantity, unit price) in VERSE",
          "Total amount, stored in base units (token decimals)",
          "Recipient wallet address (the merchant's payment address)",
          "Token contract and chain ID (locked to the trusted VERSE contract)",
          "Due date and optional notes",
        ],
      },
      { type: "h2", text: "Status lifecycle" },
      {
        type: "p",
        text: "Invoices start as DRAFT, become PENDING when published, move to PROCESSING while a payment is being verified, and then reach a terminal state: PAID, UNDERPAID, OVERPAID, EXPIRED, or CANCELLED. Transitions are enforced server-side — an invoice can never jump straight from DRAFT to PAID.",
      },
      {
        type: "callout",
        tone: "warn",
        text: "Cancelled and expired invoices are hidden from lists and their payment links return 404, so a cancelled invoice can no longer accept funds.",
      },
    ],
  },

  payments: {
    title: "Payments",
    description: "How payments are recorded and confirmed.",
    blocks: [
      {
        type: "p",
        text: "A payment is the record of an on-chain transaction submitted against an invoice. When a customer sends VERSE, VerseBill stores the transaction hash and then verifies it against the blockchain before the payment is considered confirmed.",
      },
      { type: "h2", text: "Payment states" },
      {
        type: "list",
        items: [
          "PROCESSING — the transaction hash was submitted and verification has not yet confirmed it",
          "CONFIRMED — the transaction was verified on-chain and matched the invoice",
          "REJECTED — verification found a mismatch (wrong token, recipient, chain, or amount)",
          "FAILED — the transaction reverted on-chain",
        ],
      },
      {
        type: "p",
        text: "Each payment is keyed by chain ID and transaction hash, which is what makes repeated submissions idempotent (see Idempotency).",
      },
    ],
  },

  "payment-verification": {
    title: "Payment Verification",
    description: "How a payment is checked against the blockchain.",
    blocks: [
      {
        type: "p",
        text: "When a transaction hash is submitted, VerseBill reads it from the Polygon RPC and evaluates it against a strict set of rules. This happens server-side; the customer's wallet UI is not the source of truth.",
      },
      { type: "h2", text: "What is verified" },
      {
        type: "list",
        items: [
          "The transaction exists on the configured network",
          "The transaction succeeded (the receipt status is success)",
          "The network (chain ID) matches the invoice",
          "The token contract matches the trusted VERSE contract",
          "The recipient is the merchant wallet assigned to the invoice",
          "The transferred amount matches the invoice total",
          "The transaction has the required number of confirmations",
        ],
      },
      {
        type: "callout",
        tone: "info",
        text: "The transfer amount is read from the ERC-20 Transfer event logs, not from a client-provided value. In production mode, 30 confirmations are required by default before an invoice is marked paid.",
      },
    ],
  },

  "merchant-flow": {
    title: "Merchant Flow",
    description: "The merchant's journey from signup to getting paid.",
    blocks: [
      {
        type: "steps",
        items: [
          "Sign in with Privy to create an account and embedded wallet",
          "Create an invoice with customer details and line items",
          "Publish the invoice to generate a payment link",
          "Share the link with the customer",
          "The customer pays; VerseBill verifies the transaction on-chain",
          "The invoice is marked paid and the payment appears on the dashboard",
        ],
      },
      {
        type: "p",
        text: "The merchant's payment address is set once at signup and used for all invoices. The settings page shows the wallet address, its VERSE and POL balances, and a withdraw action.",
      },
    ],
  },

  "customer-flow": {
    title: "Customer Flow",
    description: "How a customer pays an invoice.",
    blocks: [
      {
        type: "steps",
        items: [
          "Open the shared payment link",
          "Review the invoice amount, merchant, and recipient address",
          "Connect a wallet and sign the VERSE transfer on Polygon",
          "Submit the transaction hash",
          "VerseBill verifies the transaction and updates the status",
        ],
      },
      {
        type: "p",
        text: "While verification is pending the customer sees a processing state. The page keeps polling until the payment reaches a terminal state, so the customer is not left waiting on a stuck screen.",
      },
    ],
  },

  architecture: {
    title: "Architecture",
    description: "How the frontend, API, database, and blockchain interact.",
    blocks: [
      {
        type: "p",
        text: "VerseBill is a Next.js application with an App Router frontend, API route handlers, a Prisma-backed Supabase Postgres database, and a viem client for reading the Polygon blockchain.",
      },
      {
        type: "steps",
        items: [
          "Frontend (Next.js / React, Tailwind CSS)",
          "Application/API layer (Next.js route handlers)",
          "Supabase / Postgres (Prisma ORM)",
          "Blockchain RPC (viem public client)",
          "Polygon network",
          "VERSE token (ERC-20)",
          "On-chain transaction verification",
        ],
      },
      { type: "h2", text: "Request flow" },
      {
        type: "list",
        items: [
          "The browser calls an API route with the authenticated session",
          "The route validates input and authorizes the request against the merchant",
          "Server modules read and write Postgres via Prisma",
          "Payment verification reads the blockchain through a server-side RPC",
          "The route returns JSON that the client renders",
        ],
      },
      {
        type: "callout",
        tone: "info",
        text: "The browser never talks to the database or the RPC directly. All chain reads and database writes happen on the server.",
      },
    ],
  },

  authentication: {
    title: "Authentication",
    description: "How users authenticate with Privy and how the server verifies them.",
    blocks: [
      {
        type: "p",
        text: "VerseBill uses Privy for authentication and embedded wallets. The server verifies a Privy-issued access token on every authenticated request and loads the matching user and merchant records.",
      },
      { type: "h2", text: "How it works" },
      {
        type: "list",
        items: [
          "The client signs in with Privy and receives an access token",
          "The token is sent with API requests (Bearer header or privy-token cookie)",
          "The server verifies the token with the Privy client",
          "The verified user ID is matched to a User and Merchant in Postgres",
        ],
      },
      {
        type: "callout",
        tone: "info",
        text: "The server trusts only the verified Privy token and the database. The client cannot be trusted to assert its own identity, wallet address, or payment state.",
      },
      {
        type: "p",
        text: "Privy also supports HttpOnly cookie sessions via PRIVY_USE_HTTPONLY_COOKIES; the middleware refreshes expired access tokens through a /refresh route.",
      },
    ],
  },

  database: {
    title: "Database",
    description: "The Postgres schema and its core entities.",
    blocks: [
      {
        type: "p",
        text: "VerseBill stores data in Supabase Postgres and accesses it through Prisma. The schema is defined in prisma/schema.prisma.",
      },
      { type: "h2", text: "Entities" },
      {
        type: "list",
        items: [
          "User — one row per Privy user, holding the role and wallet address",
          "Merchant — business profile, payment wallet, and invoice sequence",
          "Invoice — the bill itself, with status, amount, line items, and payment target",
          "Payment — a submitted transaction hash and its verification outcome",
          "AuditLog — an append-only record of key events",
        ],
      },
      { type: "h2", text: "Relationships" },
      {
        type: "list",
        items: [
          "A User has one Merchant (merchant.userId is unique)",
          "A Merchant has many Invoices",
          "An Invoice has many Payments",
          "AuditLog optionally references a User and an Invoice",
        ],
      },
      {
        type: "callout",
        tone: "info",
        text: "Database credentials and service-role keys are server-side only and are never exposed to the client.",
      },
    ],
  },

  "blockchain-integration": {
    title: "Blockchain Integration",
    description: "How VerseBill talks to Polygon and the VERSE token.",
    blocks: [
      {
        type: "p",
        text: "VerseBill reads the blockchain with a viem public client created from a server-side RPC URL. It never relies on a wallet library to confirm payment.",
      },
      { type: "h2", text: "Network and token" },
      {
        type: "list",
        items: [
          "Network: Polygon PoS (chain ID 137)",
          "Token: VERSE (ERC-20)",
          "Decimals: 18",
          "Gas token: POL",
        ],
      },
      {
        type: "code",
        lang: "text",
        title: "Trusted VERSE contract (production)",
        code: "0xc708d6f2153933daa50b2d0758955be0a93a8fec",
      },
      {
        type: "callout",
        tone: "warn",
        text: "The contract address and chain ID are treated as configuration and validated before a transaction is accepted. Production mode refuses any chain other than Polygon PoS and any token other than the official VERSE contract.",
      },
    ],
  },

  "on-chain-verification": {
    title: "On-chain Verification",
    description: "The exact rules used to accept or reject a payment.",
    blocks: [
      {
        type: "p",
        text: "The backend does not blindly trust frontend success messages, wallet UI, or a client-provided transaction status. It fetches the transaction and its receipt from the RPC and evaluates them with a deterministic rule set.",
      },
      {
        type: "steps",
        items: [
          "Fetch the transaction by hash from the RPC",
          "Fetch the transaction receipt and the current block number",
          "Reject if the chain ID does not match the invoice",
          "Reject if the token is not the trusted VERSE contract",
          "Reject if the transaction does not exist or reverted",
          "Decode ERC-20 Transfer logs from the receipt",
          "Sum transfers to the merchant wallet",
          "Reject if nothing was sent to the merchant wallet",
          "Require the configured number of confirmations",
          "Compare the received amount to the invoice total (exact / under / over)",
        ],
      },
      {
        type: "code",
        lang: "text",
        title: "Confirmation threshold (production)",
        code: "VERSE_REQUIRED_CONFIRMATIONS=30",
      },
      {
        type: "callout",
        tone: "info",
        text: "An invoice should only transition to PAID after successful server-side verification. The 30-confirmation threshold is probabilistic finality on Polygon, not the Ethereum checkpoint.",
      },
    ],
  },

  "api-overview": {
    title: "API Overview",
    description: "The application API routes and what they do.",
    blocks: [
      {
        type: "p",
        text: "VerseBill exposes a set of internal API routes. All state-changing routes require authentication except the public pay/verify routes, which are rate-limited and operate on public invoice IDs.",
      },
      { type: "h2", text: "Routes" },
      {
        type: "list",
        items: [
          "POST /api/me — provision or update the authenticated user and merchant",
          "GET /api/invoices — list the merchant's invoices (filter, cursor, take)",
          "POST /api/invoices — create an invoice",
          "GET /api/invoices/[id] — fetch one invoice",
          "POST /api/invoices/[id]/publish — publish a draft invoice",
          "POST /api/invoices/[id]/cancel — cancel an invoice",
          "GET /api/dashboard/stats — dashboard summary statistics",
          "GET /api/pay/[publicId] — public payment details for an invoice",
          "POST /api/pay/[publicId]/submit — submit a transaction hash",
          "POST /api/payments/[id]/verify — re-run verification for a payment",
          "GET /api/verify/[publicId] — public verification status",
          "GET /api/settings — merchant settings",
          "PATCH /api/settings — update merchant settings",
          "GET /api/settings/wallet — wallet address and balances",
          "GET /api/health — service health and configuration status",
        ],
      },
      {
        type: "callout",
        tone: "warn",
        text: "This list documents the implemented application routes only. Internal admin and cron routes are intentionally omitted.",
      },
    ],
  },

  "security-model": {
    title: "Security Model",
    description: "The security controls actually implemented.",
    blocks: [
      {
        type: "p",
        text: "VerseBill layers several concrete mechanisms to reduce fraud and payment mistakes. It is not, and does not claim to be, fraud-proof.",
      },
      {
        type: "list",
        items: [
          "Authentication via verified Privy access tokens",
          "Authorization checks that a merchant owns the resource",
          "Zod input validation on every state-changing route",
          "In-memory rate limiting on sensitive endpoints",
          "Idempotency for payment submissions (unique chain ID + tx hash)",
          "Server-side on-chain verification before marking paid",
          "Strict Content-Security-Policy and security headers",
          "Server-side secrets; never exposed to the browser",
        ],
      },
    ],
  },

  "payment-safety": {
    title: "Payment Safety",
    description: "How VerseBill prevents incorrect payments from being accepted.",
    blocks: [
      {
        type: "p",
        text: "The core safety property is that an invoice is marked paid only after the server verifies the transaction on-chain. No amount of client-side UI can flip an invoice to paid.",
      },
      {
        type: "list",
        items: [
          "The recipient wallet is fixed per invoice and shown to the customer before signing",
          "The token contract is validated against the trusted VERSE contract",
          "The network is validated against the configured chain ID",
          "The transferred amount is read from ERC-20 Transfer logs",
          "Failed or reverted transactions are rejected",
          "A cancelled invoice can no longer accept payments",
        ],
      },
    ],
  },

  "input-validation": {
    title: "Input Validation",
    description: "How request bodies are validated.",
    blocks: [
      {
        type: "p",
        text: "Every state-changing route validates its request body with Zod schemas defined in src/lib/validation.ts. Unknown fields are rejected and values are constrained.",
      },
      {
        type: "list",
        items: [
          "Amounts must be positive decimals and are stored in base units",
          "Quantities must be positive integers",
          "Wallet addresses and transaction hashes are validated with viem",
          "Email addresses are validated and length-limited",
          "Line items and text fields have length caps",
          "Public IDs must match the expected format",
        ],
      },
    ],
  },

  "authentication-authorization": {
    title: "Authentication & Authorization",
    description: "How identity is established and access is checked.",
    blocks: [
      {
        type: "p",
        text: "Authentication establishes who is calling; authorization establishes what they may touch.",
      },
      { type: "h2", text: "Authentication" },
      {
        type: "p",
        text: "The server extracts the Privy access token (Bearer header or privy-token cookie), verifies it with Privy, and loads the matching User and Merchant. Missing or invalid tokens return 401.",
      },
      { type: "h2", text: "Authorization" },
      {
        type: "p",
        text: "Routes that operate on an invoice or merchant assert that the authenticated merchant owns the resource. Requests for another merchant's data return 403.",
      },
    ],
  },

  "rate-limiting": {
    title: "Rate Limiting",
    description: "How abusive request volume is limited.",
    blocks: [
      {
        type: "p",
        text: "Sensitive endpoints apply an in-memory rate limit keyed by client IP (derived from x-forwarded-for or x-real-ip). Each limiter is configured with a request count and a time window.",
      },
      {
        type: "p",
        text: "When the limit is exceeded the route returns 429 with a short message. The public pay and verify routes are rate-limited because they are reachable without authentication.",
      },
    ],
  },

  idempotency: {
    title: "Idempotency",
    description: "How repeated payment submissions are handled safely.",
    blocks: [
      {
        type: "p",
        text: "A customer may submit the same transaction more than once (retries, double clicks, reconnects). VerseBill prevents duplicate payment records with a unique constraint on (chain ID, transaction hash).",
      },
      {
        type: "list",
        items: [
          "Submitting an existing hash for the same invoice returns the existing payment",
          "Submitting a hash already used for a different invoice is rejected with TX_REUSED",
          "Concurrent submissions are caught and resolved against the unique constraint",
        ],
      },
    ],
  },

  "environment-variables": {
    title: "Environment Variables",
    description: "The configuration required to run VerseBill.",
    blocks: [
      {
        type: "p",
        text: "These are the variables the project actually reads. Values shown are placeholders; real secrets live only in the deployment environment.",
      },
      {
        type: "code",
        lang: "bash",
        title: "Database (Supabase Postgres)",
        code: `DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres`,
      },
      {
        type: "code",
        lang: "bash",
        title: "Privy",
        code: `NEXT_PUBLIC_PRIVY_APP_ID=YOUR_APP_ID_HERE
PRIVY_APP_SECRET=YOUR_VALUE_HERE
PRIVY_VERIFICATION_KEY=YOUR_VALUE_HERE
PRIVY_USE_HTTPONLY_COOKIES=false`,
      },
      {
        type: "code",
        lang: "bash",
        title: "Network / VERSE",
        code: `VERSE_NETWORK_MODE=production
NEXT_PUBLIC_NETWORK_MODE=production
POLYGON_RPC_URL=YOUR_RPC_URL_HERE
VERSE_REQUIRED_CONFIRMATIONS=30`,
      },
      {
        type: "code",
        lang: "bash",
        title: "Misc",
        code: `APP_URL=YOUR_VALUE_HERE
CRON_SECRET=YOUR_VALUE_HERE
RESEND_API_KEY=YOUR_VALUE_HERE
VERSE_ANALYTICS_ENDPOINT=YOUR_VALUE_HERE
VERSE_ANALYTICS_KEY=YOUR_VALUE_HERE`,
      },
      {
        type: "callout",
        tone: "warn",
        text: "Never place real secrets in documentation or the repository. See .env.example for the full annotated list.",
      },
    ],
  },

  "local-development": {
    title: "Local Development",
    description: "Running VerseBill on your machine.",
    blocks: [
      {
        type: "code",
        lang: "bash",
        title: "Install and run",
        code: `npm install
cp .env.example .env.local
# fill in DATABASE_URL, DIRECT_URL, Privy, and POLYGON_RPC_URL
npx prisma migrate deploy
npm run dev`,
      },
      {
        type: "list",
        items: [
          "Use VERSE_NETWORK_MODE=demo for local testing against a test chain",
          "Use VERSE_NETWORK_MODE=production to use Polygon PoS and real VERSE",
          "The production build is tested with npm run build && npm start",
        ],
      },
    ],
  },

  "production-deployment": {
    title: "Production Deployment",
    description: "How VerseBill is built and deployed.",
    blocks: [
      {
        type: "p",
        text: "VerseBill is deployed on Vercel. The build runs Prisma migrations and then the Next.js production build.",
      },
      {
        type: "code",
        lang: "bash",
        title: "Build command",
        code: "prisma migrate deploy && next build",
      },
      {
        type: "list",
        items: [
          "Set all environment variables in the Vercel dashboard",
          "Use VERSE_NETWORK_MODE=production and NEXT_PUBLIC_NETWORK_MODE=production",
          "Point DATABASE_URL and DIRECT_URL at the Supabase poolers",
          "Configure the cron secret to match Vercel Cron",
        ],
      },
    ],
  },

  "verse-integration": {
    title: "Verse Integration",
    description: "How VerseBill integrates with the Verse ecosystem.",
    blocks: [
      {
        type: "p",
        text: "VerseBill is built for the Verse ecosystem. It accepts VERSE as the payment token and verifies payments on Polygon against the official VERSE contract.",
      },
      { type: "h2", text: "Network" },
      { type: "list", items: ["Polygon PoS (chain ID 137)"] },
      { type: "h2", text: "Token contract" },
      {
        type: "code",
        lang: "text",
        code: "0xc708d6f2153933daa50b2d0758955be0a93a8fec",
      },
      {
        type: "callout",
        tone: "info",
        text: "The contract address is configuration and is validated before any transaction is accepted.",
      },
    ],
  },

  "verse-app-analytics": {
    title: "Verse App Analytics",
    description: "How analytics events are reported.",
    blocks: [
      {
        type: "p",
        text: "VerseBill reports product events (invoice_created, payment_submitted, invoice_paid, and others) to a Verse analytics endpoint when it is configured.",
      },
      {
        type: "list",
        items: [
          "Events are posted to VERSE_ANALYTICS_ENDPOINT with a bearer key",
          "Payloads are sanitized so no email, name, token, or secret is sent",
          "The analytics domain should correspond to the deployed VerseBill application domain",
          "If the endpoint or key is unset, events are simply not sent",
        ],
      },
    ],
  },

  "verse-hub": {
    title: "Verse Hub",
    description: "Verse Hub registration status.",
    blocks: [
      {
        type: "p",
        text: "Verse Hub registration is part of the Verse Buildathon requirements. This section tracks its status.",
      },
      {
        type: "check",
        items: ["Verse Hub registration — not yet completed"],
      },
    ],
  },

  polygon: {
    title: "Polygon",
    description: "Why VerseBill uses Polygon and how it is configured.",
    blocks: [
      {
        type: "p",
        text: "VerseBill runs payments on Polygon PoS because VERSE is deployed there and Polygon offers fast, low-cost transactions.",
      },
      {
        type: "list",
        items: [
          "Chain ID: 137",
          "Block time: approximately 2 seconds",
          "Gas token: POL",
          "Explorer: polygonscan.com",
        ],
      },
      {
        type: "callout",
        tone: "info",
        text: "Production mode hard-requires chain ID 137; any other chain is rejected at configuration time.",
      },
    ],
  },

  "verse-payment-support": {
    title: "VERSE Payment Support",
    description: "How VERSE payments are supported end to end.",
    blocks: [
      {
        type: "p",
        text: "VerseBill supports VERSE as its payment token across the whole flow: invoices are denominated in VERSE, customers pay VERSE on Polygon, and the server verifies VERSE transfers against the official contract.",
      },
      {
        type: "check",
        items: [
          "VERSE-denominated invoices",
          "VERSE transfer on Polygon",
          "On-chain VERSE verification",
          "VERSE/POL balance display and withdraw",
        ],
      },
    ],
  },
};
