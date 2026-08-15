import { NextRequest } from "next/server";
import { errorResponse, getRequestId, json } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { verifyPayment } from "@/server/verify-payment";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const requestId = getRequestId(req.headers);
  try {
    await rateLimit({
      key: `pay-verify:${clientIp(req.headers)}`,
      limit: 30,
      windowMs: 60_000,
    });
    const { id } = await ctx.params;
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundError();
    const outcome = await verifyPayment(payment.id);
    return json({
      requestId,
      payment: outcome.payment,
      invoiceStatus: outcome.invoiceStatus,
      reason: outcome.reason,
    });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}
