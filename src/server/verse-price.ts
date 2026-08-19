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

const ETHEREUM_VERSE = "0x249ca82617ec3dfb2589c4c17ab7ec9765350a18";
const PUBLIC_BASE = "https://api.coingecko.com/api/v3";

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
  const raw = Number.parseInt(process.env.VERSE_PRICE_CACHE_MS ?? "60000", 10);
  if (!Number.isFinite(raw) || raw < 5_000 || raw > 300_000) return 60_000;
  return raw;
}

function minimumUsd(): string {
  const raw = (process.env.VERSE_MINIMUM_USD ?? DEFAULT_MINIMUM_USD).trim();
  parseUsdAmount(raw);
  return raw;
}

function publicHeaders(): Headers {
  const headers = new Headers({
    accept: "application/json",
    "user-agent": "VerseBill/1.0",
  });
  const key = (process.env.COINGECKO_API_KEY ?? "").trim();
  if (key) headers.set("x-cg-demo-api-key", key);
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

function priceFromTokenMap(body: unknown, address: string): string | null {
  if (!body || typeof body !== "object") return null;
  const row = (body as Record<string, unknown>)[address.toLowerCase()];
  if (!row || typeof row !== "object") return null;
  try {
    return jsonNumberToDecimalString((row as Record<string, unknown>).usd);
  } catch {
    return null;
  }
}

async function getJson(fetchFn: typeof fetch, url: string): Promise<{ status: number; body: unknown }> {
  const res = await fetchFn(url, {
    headers: publicHeaders(),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

async function fetchFromCoinGecko(deps: VersePriceDeps): Promise<string> {
  const fetchFn = deps.fetch ?? fetch;
  const polygon = TRUSTED_PRODUCTION_TOKEN.toLowerCase();
  const ethereum = ETHEREUM_VERSE.toLowerCase();
  const urls = [
    `${PUBLIC_BASE}/simple/token_price/polygon-pos?contract_addresses=${polygon}&vs_currencies=usd`,
    `${PUBLIC_BASE}/simple/token_price/ethereum?contract_addresses=${ethereum}&vs_currencies=usd`,
  ];

  let rateLimited = false;
  for (const url of urls) {
    let status: number;
    let body: unknown;
    try {
      const got = await getJson(fetchFn, url);
      status = got.status;
      body = got.body;
    } catch {
      continue;
    }
    if (status === 429) {
      rateLimited = true;
      continue;
    }
    if (status < 200 || status >= 300) {
      logger.warn("coingecko_http", { status });
      continue;
    }
    const fromPolygon = priceFromTokenMap(body, polygon);
    if (fromPolygon) return fromPolygon;
    const fromEth = priceFromTokenMap(body, ethereum);
    if (fromEth) return fromEth;
  }

  if (rateLimited && cache) {
    logger.warn("coingecko_rate_limited_using_cache");
    return cache.quote.priceUsd;
  }
  throw priceUnavailable();
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
