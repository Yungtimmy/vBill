import { formatUnits, parseUnits } from "viem";

const MAX_HUMAN = 1_000_000_000_000n;

export function parseVerseAmount(human: string, decimals: number): bigint {
  if (typeof human !== "string") {
    throw new AmountError("Amount must be a string.");
  }
  const trimmed = human.trim();
  if (!trimmed) {
    throw new AmountError("Amount is required.");
  }
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new AmountError("Amount must be a positive decimal.");
  }
  if (trimmed.includes(".")) {
    const frac = trimmed.split(".")[1] ?? "";
    if (frac.length > decimals) {
      throw new AmountError(`Amount cannot have more than ${decimals} decimal places.`);
    }
  }
  const value = parseUnits(trimmed, decimals);
  if (value <= 0n) {
    throw new AmountError("Amount must be greater than zero.");
  }
  const whole = value / 10n ** BigInt(decimals);
  if (whole > MAX_HUMAN) {
    throw new AmountError("Amount exceeds the allowed maximum.");
  }
  return value;
}

export function formatVerseAmount(baseUnits: bigint, decimals: number): string {
  if (baseUnits < 0n) {
    throw new AmountError("Amount cannot be negative.");
  }
  return formatUnits(baseUnits, decimals);
}

export function parseBaseUnits(raw: string): bigint {
  if (!/^\d+$/.test(raw)) {
    throw new AmountError("Base units must be an unsigned integer string.");
  }
  return BigInt(raw);
}

export function amountRelation(
  received: bigint,
  expected: bigint,
): "exact" | "under" | "over" {
  if (received === expected) return "exact";
  if (received < expected) return "under";
  return "over";
}

export function multiplyQuantity(unitBaseUnits: bigint, quantity: bigint): bigint {
  if (quantity <= 0n) {
    throw new AmountError("Quantity must be greater than zero.");
  }
  if (unitBaseUnits <= 0n) {
    throw new AmountError("Unit price must be greater than zero.");
  }
  return unitBaseUnits * quantity;
}

export function parseQuantity(raw: string): bigint {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new AmountError("Quantity must be a positive integer.");
  }
  const q = BigInt(trimmed);
  if (q <= 0n) {
    throw new AmountError("Quantity must be greater than zero.");
  }
  if (q > 1_000_000_000n) {
    throw new AmountError("Quantity exceeds the allowed maximum.");
  }
  return q;
}

export class AmountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AmountError";
  }
}
