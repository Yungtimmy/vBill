import { describe, expect, it } from "vitest";
import {
  addressSchema,
  createInvoiceSchema,
  publicIdSchema,
  submitPaymentSchema,
  txHashSchema,
} from "@/lib/validation";

const okAddr = "0x83a1b9c141f2aaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const okHash = "0x" + "ab".repeat(32);

describe("validation", () => {
  it("rejects malformed wallets and hashes", () => {
    expect(addressSchema.safeParse("not-an-address").success).toBe(false);
    expect(addressSchema.safeParse("0x123").success).toBe(false);
    expect(txHashSchema.safeParse("0x123").success).toBe(false);
    expect(submitPaymentSchema.safeParse({ txHash: "nope" }).success).toBe(false);
  });

  it("rejects unexpected fields", () => {
    const parsed = createInvoiceSchema.safeParse({
      customerName: "Ada",
      items: [{ description: "Work", quantity: "1", unitPrice: "10" }],
      status: "PAID",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a client-supplied market price", () => {
    expect(
      createInvoiceSchema.safeParse({
        customerName: "Ada",
        items: [{ description: "Work", quantity: "1", unitPrice: "10" }],
        priceUsd: "0.000018",
        usdValue: "999",
      }).success,
    ).toBe(false);
  });

  it("rejects zero and negative amounts", () => {
    expect(
      createInvoiceSchema.safeParse({
        customerName: "Ada",
        items: [{ description: "Work", quantity: "1", unitPrice: "0" }],
      }).success,
    ).toBe(false);
    expect(
      createInvoiceSchema.safeParse({
        customerName: "Ada",
        items: [{ description: "Work", quantity: "1", unitPrice: "-5" }],
      }).success,
    ).toBe(false);
  });

  it("rejects invalid dates", () => {
    expect(
      createInvoiceSchema.safeParse({
        customerName: "Ada",
        dueDate: "tomorrow",
        items: [{ description: "Work", quantity: "1", unitPrice: "1" }],
      }).success,
    ).toBe(false);
  });

  it("rejects enumerable public ids", () => {
    expect(publicIdSchema.safeParse("1").success).toBe(false);
    expect(publicIdSchema.safeParse("a".repeat(36)).success).toBe(true);
  });

  it("accepts a well-formed tx hash", () => {
    expect(txHashSchema.safeParse(okHash).success).toBe(true);
  });
});
