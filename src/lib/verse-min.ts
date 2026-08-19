import { formatUnits, parseUnits } from "viem";
import { AmountError } from "@/lib/amounts";

export const PRICE_DECIMALS = 18;
export const DEFAULT_MINIMUM_USD = "1";

export function ceilDiv(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) {
    throw new AmountError("Invalid divisor.");
  }
  if (numerator <= 0n) return 0n;
  return (numerator + denominator - 1n) / denominator;
}

export function parseDecimalString(raw: string, decimals: number, label: string): bigint {
  if (typeof raw !== "string") {
    throw new AmountError(`${label} must be a string.`);
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new AmountError(`${label} is required.`);
  }
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new AmountError(`${label} must be a positive decimal.`);
  }
  if (trimmed.includes(".")) {
    const frac = trimmed.split(".")[1] ?? "";
    if (frac.length > decimals) {
      throw new AmountError(`${label} has too many decimal places.`);
    }
  }
  const value = parseUnits(trimmed, decimals);
  if (value <= 0n) {
    throw new AmountError(`${label} must be greater than zero.`);
  }
  return value;
}

export function parsePriceUsd(raw: string): bigint {
  return parseDecimalString(raw, PRICE_DECIMALS, "Price");
}

export function parseUsdAmount(raw: string): bigint {
  return parseDecimalString(raw, PRICE_DECIMALS, "USD amount");
}

export function usdValueScaled(
  amountBaseUnits: bigint,
  priceScaled: bigint,
  tokenDecimals: number,
): bigint {
  if (amountBaseUnits <= 0n || priceScaled <= 0n) {
    throw new AmountError("Amount and price must be greater than zero.");
  }
  return (amountBaseUnits * priceScaled) / 10n ** BigInt(tokenDecimals);
}

export function meetsMinimumUsd(
  amountBaseUnits: bigint,
  priceScaled: bigint,
  minimumUsdScaled: bigint,
  tokenDecimals: number,
): boolean {
  return usdValueScaled(amountBaseUnits, priceScaled, tokenDecimals) >= minimumUsdScaled;
}

export function minVerseBaseUnits(
  priceScaled: bigint,
  minimumUsdScaled: bigint,
  tokenDecimals: number,
): bigint {
  if (priceScaled <= 0n) {
    throw new AmountError("Price must be greater than zero.");
  }
  return ceilDiv(minimumUsdScaled * 10n ** BigInt(tokenDecimals), priceScaled);
}

export function verseBaseForUsd(
  usdScaled: bigint,
  priceScaled: bigint,
  tokenDecimals: number,
): bigint {
  if (priceScaled <= 0n || usdScaled <= 0n) {
    throw new AmountError("USD amount and price must be greater than zero.");
  }
  return ceilDiv(usdScaled * 10n ** BigInt(tokenDecimals), priceScaled);
}

export function formatUsdFromScaled(scaled: bigint, maxFraction = 8): string {
  const raw = formatUnits(scaled, PRICE_DECIMALS);
  if (!raw.includes(".")) return raw;
  const [whole, frac] = raw.split(".");
  const digits = whole === "0" ? Math.max(maxFraction, 2) : 2;
  const sliced = (frac + "0".repeat(digits)).slice(0, digits).replace(/0+$/, "");
  return sliced ? `${whole}.${sliced}` : whole;
}

export function jsonNumberToDecimalString(n: unknown): string {
  const value = typeof n === "number" ? n : typeof n === "string" ? Number(n) : Number.NaN;
  if (!Number.isFinite(value) || value <= 0 || value > 1_000_000) {
    throw new AmountError("Invalid market price.");
  }
  const fixed = value.toFixed(PRICE_DECIMALS);
  return fixed.replace(/\.?0+$/, "") || "0";
}
