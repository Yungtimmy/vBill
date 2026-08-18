import { describe, expect, it } from "vitest";
import { ForbiddenError } from "@/lib/errors";
import { assertMerchantOwns } from "@/lib/authz";

describe("authorization helpers", () => {
  it("denies cross-merchant access", () => {
    expect(() => assertMerchantOwns("merchant-a", "merchant-b")).toThrow(ForbiddenError);
    expect(() => assertMerchantOwns("merchant-a", "merchant-a")).not.toThrow();
  });

});
