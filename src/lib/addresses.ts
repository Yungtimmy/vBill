import { getAddress, isAddress, type Address, type Hex, isHash } from "viem";

export function normalizeAddress(value: string): Address {
  if (typeof value !== "string" || !isAddress(value, { strict: false })) {
    throw new Error("Invalid wallet address.");
  }
  return getAddress(value);
}

export function sameAddress(a: string, b: string): boolean {
  return normalizeAddress(a) === normalizeAddress(b);
}

export function normalizeTxHash(value: string): Hex {
  const trimmed = value.trim();
  if (!isHash(trimmed)) {
    throw new Error("Invalid transaction hash.");
  }
  return trimmed.toLowerCase() as Hex;
}

export function shortenAddress(address: string): string {
  const a = normalizeAddress(address);
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function shortenHash(hash: string): string {
  const h = normalizeTxHash(hash);
  return `${h.slice(0, 6)}…${h.slice(-4)}`;
}
