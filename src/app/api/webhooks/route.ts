import { NextRequest } from "next/server";
import { errorResponse, getRequestId, json } from "@/lib/api";
import { verifySignedRequest } from "@/lib/hmac";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/server/audit";
import { AppError } from "@/lib/errors";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  try {
    await rateLimit({
      key: `webhook:${clientIp(req.headers)}`,
      limit: 60,
      windowMs: 60_000,
    });
    const secret = process.env.WEBHOOK_HMAC_SECRET;
    if (!secret) {
      throw new AppError("NOT_CONFIGURED", "Webhook signing is not configured.", 503);
    }
    const body = await req.text();
    const check = verifySignedRequest({
      secret,
      body,
      timestampHeader: req.headers.get("x-timestamp"),
      nonceHeader: req.headers.get("x-nonce"),
      signatureHeader: req.headers.get("x-signature"),
    });
    if (!check.ok) {
      await writeAudit({
        event: "WEBHOOK_REJECTED",
        metadata: { reason: check.reason },
      });
      throw new AppError("INVALID_SIGNATURE", "Invalid request signature.", 401);
    }

    const existing = await prisma.processedWebhook.findUnique({
      where: { source_eventId: { source: "generic", eventId: check.nonce } },
    });
    if (existing) {
      return json({ requestId, status: "ignored" });
    }

    await prisma.processedWebhook.create({
      data: { source: "generic", eventId: check.nonce },
    });
    await writeAudit({
      event: "WEBHOOK_ACCEPTED",
      metadata: { eventId: check.nonce },
    });

    return json({
      requestId,
      status: "accepted",
      note: "Webhooks never mark invoices paid. Only on-chain verification can.",
    });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}
