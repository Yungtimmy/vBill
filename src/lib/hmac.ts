import { createHmac, timingSafeEqual, randomBytes } from "crypto";

const MAX_AGE_SECONDS = 5 * 60;

export function signPayload(secret: string, body: string, timestamp: number, nonce: string): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(`${timestamp}.${nonce}.${body}`);
  return hmac.digest("hex");
}

export function verifySignedRequest(input: {
  secret: string;
  body: string;
  timestampHeader: string | null;
  nonceHeader: string | null;
  signatureHeader: string | null;
  nowSeconds?: number;
}): { ok: true; nonce: string } | { ok: false; reason: "missing" | "stale" | "invalid" } {
  const { secret, body, timestampHeader, nonceHeader, signatureHeader } = input;
  if (!timestampHeader || !nonceHeader || !signatureHeader) {
    return { ok: false, reason: "missing" };
  }
  const ts = Number.parseInt(timestampHeader, 10);
  if (!Number.isFinite(ts)) return { ok: false, reason: "invalid" };
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > MAX_AGE_SECONDS) {
    return { ok: false, reason: "stale" };
  }
  const expected = signPayload(secret, body, ts, nonceHeader);
  const a = Buffer.from(expected, "hex");
  let b: Buffer;
  try {
    b = Buffer.from(signatureHeader, "hex");
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "invalid" };
  }
  return { ok: true, nonce: nonceHeader };
}

export function newNonce(): string {
  return randomBytes(16).toString("hex");
}
