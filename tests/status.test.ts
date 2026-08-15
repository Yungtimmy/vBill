import { describe, expect, it } from "vitest";
import {
  assertTransition,
  canTransition,
  isPayable,
  isTerminal,
  statusFromTotals,
} from "@/lib/invoice-status";

describe("invoice status machine", () => {
  it("allows the happy path", () => {
    expect(canTransition("DRAFT", "PENDING")).toBe(true);
    expect(canTransition("PENDING", "PROCESSING")).toBe(true);
    expect(canTransition("PROCESSING", "PAID")).toBe(true);
  });

  it("rejects illegal jumps including frontend PAID", () => {
    expect(canTransition("DRAFT", "PAID")).toBe(false);
    expect(canTransition("PENDING", "PAID")).toBe(false);
    expect(canTransition("PAID", "CANCELLED")).toBe(false);
    expect(() => assertTransition("PENDING", "PAID")).toThrow();
  });

  it("treats paid / overpaid / expired / cancelled as terminal", () => {
    expect(isTerminal("PAID")).toBe(true);
    expect(isPayable("PENDING")).toBe(true);
    expect(isPayable("PAID")).toBe(false);
  });

  it("maps totals to payment outcomes", () => {
    expect(statusFromTotals(500n, 500n)).toBe("PAID");
    expect(statusFromTotals(300n, 500n)).toBe("UNDERPAID");
    expect(statusFromTotals(600n, 500n)).toBe("OVERPAID");
  });
});
