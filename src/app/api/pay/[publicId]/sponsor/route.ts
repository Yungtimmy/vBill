import { NextRequest } from "next/server";
import { getAddress } from "viem";
import { errorResponse, getRequestId, json } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { publicIdSchema, sponsorGasSchema } from "@/lib/validation";
import { getPublicInvoice } from "@/server/invoices";
import { assertSafeMutation } from "@/lib/guard";
import { AppError } from "@/lib/errors";
import { fundPayerGas, gasSponsorEnabled } from "@/lib/gas-sponsor";

type Ctx = { params: Promise<{ publicId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const requestId = getRequestId(req.headers);
  try {
    assertSafeMutation(req.headers);
    await rateLimit({
      key: `gas-sponsor:${clientIp(req.headers)}`,
      limit: 8,
      windowMs: 60_000,
    });
    const { publicId } = await ctx.params;
    publicIdSchema.parse(publicId);
    const invoice = await getPublicInvoice(publicId);
    if (!["PENDING", "PROCESSING", "UNDERPAID"].includes(invoice.status)) {
      throw new AppError("NOT_PAYABLE", "This invoice cannot be paid.", 409);
    }
    if (!gasSponsorEnabled()) {
      return json({ requestId, sponsored: false, alreadyFunded: false, txHash: null });
    }
    const body = sponsorGasSchema.parse(await req.json());
    const to = getAddress(body.fromAddress);
    await rateLimit({
      key: `gas-sponsor-addr:${to.toLowerCase()}`,
      limit: 6,
      windowMs: 60 * 60_000,
    });
    const result = await fundPayerGas(to);
    return json({ requestId, ...result });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}
