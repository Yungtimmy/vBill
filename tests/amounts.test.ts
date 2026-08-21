import { describe, expect, it } from "vitest";
import {
  AmountError,
  amountRelation,
  ceilToFractionDigits,
  formatVerseAmount,
  formatVerseAmountCeil,
  multiplyQuantity,
  parseQuantity,
  parseVerseAmount,
} from "@/lib/amounts";

describe("token amounts", () => {
  it("converts 500 VERSE to 18-decimal base units", () => {
    expect(parseVerseAmount("500", 18)).toBe(500n * 10n ** 18n);
  });

  it("round-trips fractional amounts", () => {
    const n = parseVerseAmount("1.25", 18);
    expect(formatVerseAmount(n, 18)).toBe("1.25");
  });

  it("rejects zero, negative, and non-numeric", () => {
    expect(() => parseVerseAmount("0", 18)).toThrow(AmountError);
    expect(() => parseVerseAmount("-1", 18)).toThrow(AmountError);
    expect(() => parseVerseAmount("abc", 18)).toThrow(AmountError);
    expect(() => parseVerseAmount("1e2", 18)).toThrow(AmountError);
  });

  it("rejects too many decimals and excessive amounts", () => {
    expect(() => parseVerseAmount("1.1234567890123456789", 18)).toThrow(AmountError);
    expect(() => parseVerseAmount("1000000000001", 18)).toThrow(AmountError);
  });

  it("never uses floating point for line totals", () => {
    const unit = parseVerseAmount("0.1", 18);
    const total = multiplyQuantity(unit, parseQuantity("3"));
    expect(total).toBe(3n * 10n ** 17n);
  });

  it("classifies under / exact / over", () => {
    expect(amountRelation(300n, 500n)).toBe("under");
    expect(amountRelation(500n, 500n)).toBe("exact");
    expect(amountRelation(600n, 500n)).toBe("over");
  });

  it("ceils VERSE amounts up to 2 decimal places", () => {
    const oneWeiPast = parseVerseAmount("1.230000000000000001", 18);
    expect(formatVerseAmountCeil(oneWeiPast, 18)).toBe("1.24");
    expect(ceilToFractionDigits(oneWeiPast, 18)).toBe(parseVerseAmount("1.24", 18));
    expect(formatVerseAmountCeil(parseVerseAmount("1.23", 18), 18)).toBe("1.23");
    expect(formatVerseAmountCeil(parseVerseAmount("10", 18), 18)).toBe("10.00");
  });
});
