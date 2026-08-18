import { NextRequest } from "next/server";
import { getAddress } from "viem";
import { errorResponse, getRequestId, json } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { assertSafeMutation } from "@/lib/guard";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sponsorGasSchema } from "@/lib/validation";
import { fundPayerGas, gasSponsorEnabled } from "@/lib/gas-sponsor";
import { AppError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  try {
    assertSafeMutation(req.headers);
    const session = await requireSession(req.headers);
    await rateLimit({
      key: `gas-fund:${clientIp(req.headers)}`,
      limit: 6,
      windowMs: 60_000,
    });
    if (!gasSponsorEnabled()) {
      return json({ requestId, sponsored: false, alreadyFunded: false, txHash: null });
    }
    const body = sponsorGasSchema.parse(await req.json());
    const to = getAddress(body.fromAddress);
    const assigned = session.merchant.walletAddress.toLowerCase();
    const userWallet = (session.user.walletAddress ?? "").toLowerCase();
    if (to.toLowerCase() !== assigned && to.toLowerCase() !== userWallet) {
      throw new AppError("FORBIDDEN", "Gas can only be sponsored for your wallet.", 403);
    }
    const result = await fundPayerGas(to);
    return json({ requestId, ...result });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}
