import { describe, expect, it } from "vitest";
import { signPayload, verifySignedRequest } from "@/lib/hmac";

describe("signed requests", () => {
  const secret = "test-secret";
  const body = JSON.stringify({ invoiceId: "x" });

  it("accepts a fresh valid signature", () => {
    const ts = 1_700_000_000;
    const nonce = "abc123";
    const sig = signPayload(secret, body, ts, nonce);
    const result = verifySignedRequest({
      secret,
      body,
      timestampHeader: String(ts),
      nonceHeader: nonce,
      signatureHeader: sig,
      nowSeconds: ts,
    });
    expect(result).toEqual({ ok: true, nonce });
  });

  it("rejects a forged signature", () => {
    const result = verifySignedRequest({
      secret,
      body,
      timestampHeader: "1700000000",
      nonceHeader: "abc123",
      signatureHeader: "00".repeat(32),
      nowSeconds: 1_700_000_000,
    });
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects a stale request", () => {
    const ts = 1_700_000_000;
    const nonce = "abc123";
    const sig = signPayload(secret, body, ts, nonce);
    const result = verifySignedRequest({
      secret,
      body,
      timestampHeader: String(ts),
      nonceHeader: nonce,
      signatureHeader: sig,
      nowSeconds: ts + 10_000,
    });
    expect(result).toEqual({ ok: false, reason: "stale" });
  });
});
