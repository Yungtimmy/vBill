import { afterEach, describe, expect, it } from "vitest";
import { getAddress } from "viem";
import { createInvoiceSchema } from "@/lib/validation";
import { TRUSTED_PRODUCTION_TOKEN } from "@/lib/chain";
import { assertConfiguredVerse } from "@/server/invoices";
import { getVerseUsdQuote, resetVersePriceCache } from "@/server/verse-price";

const cfg = {
  mode: "production" as const,
  chainId: 137,
  chainName: "Polygon PoS",
  tokenAddress: getAddress(TRUSTED_PRODUCTION_TOKEN),
  tokenDecimals: 18,
  tokenSymbol: "VERSE",
  explorerUrl: "https://polygonscan.com",
  gasToken: "POL",
  requiredConfirmations: 30,
  rpcUrl: "http://127.0.0.1",
};

afterEach(() => {
  resetVersePriceCache();
  delete process.env.VERSE_MINIMUM_USD;
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("CoinGecko VERSE price service", () => {
  it("parses a valid contract-address price", async () => {
    const quote = await getVerseUsdQuote({
      now: () => 1_000,
      fetch: async () =>
        jsonResponse({
          [TRUSTED_PRODUCTION_TOKEN.toLowerCase()]: { usd: 0.000018 },
        }),
    });
    expect(quote.source).toBe("coingecko");
    expect(quote.priceUsd).toBe("0.000018");
    expect(quote.minimumUsd).toBe("1");
    expect(quote.tokenAddress).toBe(getAddress(TRUSTED_PRODUCTION_TOKEN));
    expect(quote.chainId).toBe(137);
  });

  it("caches the quote briefly", async () => {
    let hits = 0;
    const fetchFn: typeof fetch = async () => {
      hits += 1;
      return jsonResponse({
        [TRUSTED_PRODUCTION_TOKEN.toLowerCase()]: { usd: 0.000018 },
      });
    };
    await getVerseUsdQuote({ now: () => 1_000, fetch: fetchFn });
    await getVerseUsdQuote({ now: () => 10_000, fetch: fetchFn });
    expect(hits).toBe(1);
  });

  it("does not reuse an expired cache when the API fails", async () => {
    const ok: typeof fetch = async () =>
      jsonResponse({
        [TRUSTED_PRODUCTION_TOKEN.toLowerCase()]: { usd: 0.000018 },
      });
    await getVerseUsdQuote({ now: () => 1_000, fetch: ok });
    await expect(
      getVerseUsdQuote({
        now: () => 120_000,
        fetch: async () => jsonResponse({ error: "nope" }, 500),
      }),
    ).rejects.toMatchObject({ code: "PRICE_UNAVAILABLE" });
  });

  it("rejects missing usd, zero, and malformed payloads", async () => {
    await expect(
      getVerseUsdQuote({
        now: () => 1,
        fetch: async () => jsonResponse({}),
      }),
    ).rejects.toMatchObject({ code: "PRICE_UNAVAILABLE" });
    await expect(
      getVerseUsdQuote({
        now: () => 1,
        fetch: async () =>
          jsonResponse({
            [TRUSTED_PRODUCTION_TOKEN.toLowerCase()]: { usd: 0 },
          }),
      }),
    ).rejects.toMatchObject({ code: "PRICE_UNAVAILABLE" });
    await expect(
      getVerseUsdQuote({
        now: () => 1,
        fetch: async () =>
          jsonResponse({
            [TRUSTED_PRODUCTION_TOKEN.toLowerCase()]: { usd: "nope" },
          }),
      }),
    ).rejects.toMatchObject({ code: "PRICE_UNAVAILABLE" });
  });
});

describe("invoice request bypass attempts", () => {
  it("ignores a client-supplied USD price", () => {
    const parsed = createInvoiceSchema.safeParse({
      customerName: "Ada",
      items: [{ description: "Work", quantity: "1", unitPrice: "10" }],
      priceUsd: "1000",
      clientUsdValue: "999",
      minimumUsd: "0.01",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects the wrong token contract when supplied", () => {
    expect(() =>
      assertConfiguredVerse(cfg, {
        tokenAddress: "0x249ca82617ec3dfb2589c4c17ab7ec9765350a18",
      }),
    ).toThrow(/VERSE token/);
  });

  it("rejects the wrong chain when supplied", () => {
    expect(() => assertConfiguredVerse(cfg, { chainId: 1 })).toThrow(/Polygon/);
  });
});
