import { getAddress } from "viem";
import { formatUnits } from "viem";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { TRUSTED_PRODUCTION_TOKEN } from "@/lib/chain";
import {
  DEFAULT_MINIMUM_USD,
  jsonNumberToDecimalString,
  minVerseBaseUnits,
  parsePriceUsd,
  parseUsdAmount,
} from "@/lib/verse-min";

export type VerseUsdQuote = {
  token: "VERSE";
  tokenAddress: string;
  chainId: number;
  priceUsd: string;
  priceScaled: bigint;
  minimumUsd: string;
  minimumUsdScaled: bigint;
  minimumVerse: string;
  minimumVerseBaseUnits: bigint;
  source: "coingecko";
  fetchedAt: Date;
};

type CacheEntry = {
  quote: VerseUsdQuote;
  expiresAt: number;
};

let cache: CacheEntry | null = null;

export type VersePriceDeps = {
  fetch?: typeof fetch;
  now?: () => number;
};

function cacheTtlMs(): number {
  const raw = Number.parseInt(process.env.VERSE_PRICE_CACHE_MS ?? "45000", 10);
  if (!Number.isFinite(raw) || raw < 5_000 || raw > 300_000) return 45_000;
  return raw;
}

function minimumUsd(): string {
  const raw = (process.env.VERSE_MINIMUM_USD ?? DEFAULT_MINIMUM_USD).trim();
  parseUsdAmount(raw);
  return raw;
}

function apiBase(): string {
  const configured = (process.env.COINGECKO_API_BASE ?? "").trim().replace(/\/$/, "");
  if (configured) return configured;
  const key = (process.env.COINGECKO_API_KEY ?? "").trim();
  if (key && !key.startsWith("CG-") && process.env.COINGECKO_API_TYPE !== "demo") {
    return "https://pro-api.coingecko.com/api/v3";
  }
  return "https://api.coingecko.com/api/v3";
}

function platformId(): string {
  return (process.env.COINGECKO_ASSET_PLATFORM ?? "polygon-pos").trim() || "polygon-pos";
}

function authHeaders(): Headers {
  const headers = new Headers({ accept: "application/json" });
  const key = (process.env.COINGECKO_API_KEY ?? "").trim();
  if (!key) return headers;
  const base = apiBase();
  if (base.includes("pro-api.coingecko.com") || process.env.COINGECKO_API_TYPE === "pro") {
    headers.set("x-cg-pro-api-key", key);
  } else {
    headers.set("x-cg-demo-api-key", key);
  }
  return headers;
}

export function resetVersePriceCache(): void {
  cache = null;
}

export function priceUnavailable(message = "VERSE price temporarily unavailable."): AppError {
  return new AppError("PRICE_UNAVAILABLE", message, 503);
}

function buildQuote(priceUsd: string, fetchedAt: Date): VerseUsdQuote {
  const tokenAddress = getAddress(TRUSTED_PRODUCTION_TOKEN);
  const priceScaled = parsePriceUsd(priceUsd);
  const minUsd = minimumUsd();
  const minimumUsdScaled = parseUsdAmount(minUsd);
  const tokenDecimals = 18;
  const minBase = minVerseBaseUnits(priceScaled, minimumUsdScaled, tokenDecimals);
  return {
    token: "VERSE",
    tokenAddress,
    chainId: 137,
    priceUsd,
    priceScaled,
    minimumUsd: minUsd,
    minimumUsdScaled,
    minimumVerse: formatUnits(minBase, tokenDecimals),
    minimumVerseBaseUnits: minBase,
    source: "coingecko",
    fetchedAt,
  };
}

async function fetchFromCoinGecko(deps: VersePriceDeps): Promise<string> {
  const address = TRUSTED_PRODUCTION_TOKEN.toLowerCase();
  const url = `${apiBase()}/simple/token_price/${platformId()}?contract_addresses=${address}&vs_currencies=usd`;
  const fetchFn = deps.fetch ?? fetch;
  let res: Response;
  try {
    res = await fetchFn(url, {
      headers: authHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    throw priceUnavailable();
  }
  if (!res.ok) {
    logger.warn("coingecko_http", { status: res.status });
    throw priceUnavailable();
  }
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw priceUnavailable();
  }
  if (!body || typeof body !== "object") {
    throw priceUnavailable();
  }
  const row = (body as Record<string, unknown>)[address];
  if (!row || typeof row !== "object") {
    throw priceUnavailable();
  }
  const usd = (row as Record<string, unknown>).usd;
  try {
    return jsonNumberToDecimalString(usd);
  } catch {
    throw priceUnavailable();
  }
}

export async function getVerseUsdQuote(deps: VersePriceDeps = {}): Promise<VerseUsdQuote> {
  const now = (deps.now ?? Date.now)();
  if (cache && cache.expiresAt > now) {
    return cache.quote;
  }
  const priceUsd = await fetchFromCoinGecko(deps);
  const quote = buildQuote(priceUsd, new Date(now));
  cache = { quote, expiresAt: now + cacheTtlMs() };
  return quote;
}

export function quoteToPublic(quote: VerseUsdQuote) {
  return {
    symbol: quote.token,
    tokenAddress: quote.tokenAddress,
    chainId: quote.chainId,
    priceUsd: quote.priceUsd,
    minimumUsd: quote.minimumUsd,
    minimumVerse: quote.minimumVerse,
    updatedAt: quote.fetchedAt.toISOString(),
    source: quote.source,
  };
}

