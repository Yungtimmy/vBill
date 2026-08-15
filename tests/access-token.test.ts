import { describe, expect, it } from "vitest";
import { extractAccessToken, extractBearer, normalizePem } from "@/lib/auth";

describe("access token extraction", () => {
  it("reads a Bearer token", () => {
    const headers = new Headers({ authorization: "Bearer abc.def.ghi" });
    expect(extractBearer(headers)).toBe("abc.def.ghi");
    expect(extractAccessToken(headers)).toBe("abc.def.ghi");
  });

  it("reads the official privy-token cookie", () => {
    const headers = new Headers({
      cookie: "other=1; privy-token=session.jwt.value; privy-session=1",
    });
    expect(extractAccessToken(headers)).toBe("session.jwt.value");
  });

  it("prefers Bearer over the cookie", () => {
    const headers = new Headers({
      authorization: "Bearer from-header",
      cookie: "privy-token=from-cookie",
    });
    expect(extractAccessToken(headers)).toBe("from-header");
  });

  it("returns null when neither is present", () => {
    expect(extractAccessToken(new Headers())).toBeNull();
  });

  it("normalizes PEM verification keys stored with escaped newlines", () => {
    const pem = normalizePem(
      "-----BEGIN PUBLIC KEY-----\\nABC\\n-----END PUBLIC KEY-----\\n",
    );
    expect(pem).toContain("BEGIN PUBLIC KEY");
    expect(pem).toContain("\nABC\n");
    expect(pem).not.toContain("\\n");
  });
});
