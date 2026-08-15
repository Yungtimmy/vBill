import { describe, expect, it } from "vitest";
import { formatInvoiceNumber, newPublicId } from "@/lib/crypto-ids";

describe("identifiers", () => {
  it("formats human invoice numbers from a sequence", () => {
    expect(formatInvoiceNumber(1)).toBe("VB-1001");
    expect(formatInvoiceNumber(2)).toBe("VB-1002");
  });

  it("creates 36-char hex public ids that are not sequential", () => {
    const a = newPublicId();
    const b = newPublicId();
    expect(a).toMatch(/^[a-f0-9]{36}$/);
    expect(a).not.toBe(b);
  });
});
