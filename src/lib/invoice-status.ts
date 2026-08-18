import type { InvoiceStatus } from "@prisma/client";

export const TERMINAL_STATUSES: readonly InvoiceStatus[] = [
  "PAID",
  "OVERPAID",
  "EXPIRED",
  "CANCELLED",
] as const;

export const PAYABLE_STATUSES: readonly InvoiceStatus[] = [
  "PENDING",
  "UNDERPAID",
  "FAILED",
] as const;

const ALLOWED: Record<InvoiceStatus, readonly InvoiceStatus[]> = {
  DRAFT: ["PENDING", "CANCELLED"],
  PENDING: ["PROCESSING", "CANCELLED", "EXPIRED"],
  PROCESSING: ["PAID", "UNDERPAID", "OVERPAID", "FAILED", "PENDING", "CANCELLED"],
  PAID: [],
  UNDERPAID: ["PROCESSING", "CANCELLED", "PAID", "OVERPAID"],
  OVERPAID: [],
  EXPIRED: ["CANCELLED"],
  CANCELLED: [],
  FAILED: ["PENDING", "PROCESSING", "CANCELLED"],
};

export function canTransition(from: InvoiceStatus, to: InvoiceStatus): boolean {
  if (from === to) return true;
  return ALLOWED[from].includes(to);
}

export function assertTransition(from: InvoiceStatus, to: InvoiceStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal invoice status transition: ${from} → ${to}`);
  }
}

export function isTerminal(status: InvoiceStatus): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status);
}

export function isPayable(status: InvoiceStatus): boolean {
  return (PAYABLE_STATUSES as readonly string[]).includes(status);
}

export function statusFromTotals(
  confirmed: bigint,
  expected: bigint,
): Extract<InvoiceStatus, "PAID" | "UNDERPAID" | "OVERPAID"> {
  if (confirmed === expected) return "PAID";
  if (confirmed < expected) return "UNDERPAID";
  return "OVERPAID";
}
