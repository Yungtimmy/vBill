import { NextRequest } from "next/server";
import { errorResponse, getRequestId, json } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { publicIdSchema, submitPaymentSchema } from "@/lib/validation";
import { getPublicInvoice } from "@/server/invoices";
import { submitTransactionHash, verifyPayment } from "@/server/verify-payment";
import { isExpired } from "@/lib/time";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";

type Ctx = { params: Promise<{ publicId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const requestId = getRequestId(req.headers);
  try {
    await rateLimit({
      key: `pay-submit:${clientIp(req.headers)}`,
      limit: 20,
      windowMs: 60_000,
    });
    const { publicId } = await ctx.params;
    publicIdSchema.parse(publicId);
    const invoice = await getPublicInvoice(publicId);
    if (isExpired(invoice.dueDate) && invoice.status !== "PAID") {
      throw new AppError("EXPIRED", "This invoice has expired.", 409);
    }
    const body = submitPaymentSchema.parse(await req.json());
    const payment = await submitTransactionHash({
      invoice,
      txHash: body.txHash,
      fromAddress: body.fromAddress,
    });

    try {
      const outcome = await verifyPayment(payment.id);
      return json({
        requestId,
        payment: outcome.payment,
        invoiceStatus: outcome.invoiceStatus,
        reason: outcome.reason,
      });
    } catch (err) {
      logger.warn("submit_verify_deferred", {
        paymentId: payment.id,
        reason: err instanceof Error ? err.name : "unknown",
      });
      return json({
        requestId,
        payment,
        invoiceStatus: "PROCESSING",
        reason: "We're verifying your transaction.",
      });
    }
  } catch (err) {
    return errorResponse(err, requestId);
  }
}
