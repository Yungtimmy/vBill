import { describe, expect, it } from "vitest";
import { ForbiddenError } from "@/lib/errors";
import { assertMerchantOwns, isFreshAuth } from "@/lib/authz";

describe("authorization helpers", () => {
  it("denies cross-merchant access", () => {
    expect(() => assertMerchantOwns("merchant-a", "merchant-b")).toThrow(ForbiddenError);
    expect(() => assertMerchantOwns("merchant-a", "merchant-a")).not.toThrow();
  });

  it("requires fresh authentication for wallet changes", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(isFreshAuth(now - 30, 600)).toBe(true);
    expect(isFreshAuth(now - 10_000, 600)).toBe(false);
    expect(isFreshAuth(undefined, 600)).toBe(false);
  });
});
