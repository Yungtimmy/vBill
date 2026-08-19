import { describe, expect, it } from "vitest";
import { formatUnits } from "viem";
import { parseVerseAmount } from "@/lib/amounts";
import {
  jsonNumberToDecimalString,
  meetsMinimumUsd,
  minVerseBaseUnits,
  parsePriceUsd,
  parseUsdAmount,
  usdValueScaled,
  verseBaseForUsd,
} from "@/lib/verse-min";

const PRICE = "0.000018";
const DECIMALS = 18;

describe("VERSE $1 minimum math", () => {
  const price = parsePriceUsd(PRICE);
  const minUsd = parseUsdAmount("1");
  const minBase = minVerseBaseUnits(price, minUsd, DECIMALS);

  it("treats 0.000018 as the working price", () => {
    expect(jsonNumberToDecimalString(0.000018)).toBe("0.000018");
    expect(parsePriceUsd(PRICE)).toBe(price);
  });

  it("rejects 10 VERSE as below $1", () => {
    const ten = parseVerseAmount("10", DECIMALS);
    expect(meetsMinimumUsd(ten, price, minUsd, DECIMALS)).toBe(false);
  });

  it("rejects one wei below the computed minimum", () => {
    expect(meetsMinimumUsd(minBase - 1n, price, minUsd, DECIMALS)).toBe(false);
  });

  it("accepts the computed minimum VERSE amount", () => {
    expect(meetsMinimumUsd(minBase, price, minUsd, DECIMALS)).toBe(true);
    expect(usdValueScaled(minBase, price, DECIMALS) >= minUsd).toBe(true);
  });

  it("$1 quick button equals the minimum VERSE amount", () => {
    expect(verseBaseForUsd(parseUsdAmount("1"), price, DECIMALS)).toBe(minBase);
  });

  it("$10 quick button meets $10 USD", () => {
    const ten = verseBaseForUsd(parseUsdAmount("10"), price, DECIMALS);
    expect(meetsMinimumUsd(ten, price, parseUsdAmount("10"), DECIMALS)).toBe(true);
    expect(ten > minBase).toBe(true);
  });

  it("$100 quick button meets $100 USD", () => {
    const hundred = verseBaseForUsd(parseUsdAmount("100"), price, DECIMALS);
    expect(meetsMinimumUsd(hundred, price, parseUsdAmount("100"), DECIMALS)).toBe(true);
  });

  it("formats the $1 minimum near 55555.56 VERSE", () => {
    const human = Number(formatUnits(minBase, DECIMALS));
    expect(human).toBeGreaterThan(55555.55);
    expect(human).toBeLessThan(55555.57);
  });

  it("rejects invalid prices and amounts", () => {
    expect(() => jsonNumberToDecimalString(Number.NaN)).toThrow();
    expect(() => jsonNumberToDecimalString(Number.POSITIVE_INFINITY)).toThrow();
    expect(() => jsonNumberToDecimalString(0)).toThrow();
    expect(() => jsonNumberToDecimalString(-1)).toThrow();
    expect(() => parsePriceUsd("NaN")).toThrow();
    expect(() => parseUsdAmount("0")).toThrow();
    expect(() => parseUsdAmount("-1")).toThrow();
  });
});
