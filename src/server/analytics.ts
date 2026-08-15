import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const PRODUCT_EVENTS = [
  "invoice_created",
  "invoice_viewed",
  "payment_started",
  "payment_submitted",
  "payment_verified",
  "invoice_paid",
  "payment_failed",
  "qr_generated",
] as const;

export type ProductEvent = (typeof PRODUCT_EVENTS)[number];

export async function trackEvent(
  name: ProductEvent,
  payload?: Record<string, unknown>,
): Promise<void> {
  const safe = sanitize(payload);
  try {
    await prisma.analyticsEvent.create({
      data: { name, payload: safe ? JSON.parse(JSON.stringify(safe)) : undefined },
    });
  } catch {
    logger.warn("analytics_store_failed", { name });
  }

  const endpoint = process.env.VERSE_ANALYTICS_ENDPOINT;
  const key = process.env.VERSE_ANALYTICS_KEY;
  if (!endpoint || !key) {
    return;
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ name, payload: safe, ts: new Date().toISOString() }),
    });
    if (!res.ok) {
      logger.warn("verse_analytics_rejected", { status: res.status });
    }
  } catch {
    logger.warn("verse_analytics_unreachable", { name });
  }
}

function sanitize(payload?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!payload) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (/email|phone|name|token|secret|key/i.test(k)) continue;
    if (typeof v === "string" && v.includes("@")) continue;
    out[k] = v;
  }
  return out;
}
