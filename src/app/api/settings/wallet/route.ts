import { NextRequest } from "next/server";
import { errorResponse, getRequestId, json } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { assertSafeMutation } from "@/lib/guard";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { updateWalletSchema } from "@/lib/validation";
import { changeWallet } from "@/server/merchants";

export async function PATCH(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  try {
    assertSafeMutation(req.headers);
    const session = await requireSession(req.headers);
    await rateLimit({
      key: `wallet-change:${session.user.id}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    await rateLimit({
      key: `wallet-change-ip:${clientIp(req.headers)}`,
      limit: 8,
      windowMs: 60 * 60 * 1000,
    });
    const body = updateWalletSchema.parse(await req.json());
    const merchant = await changeWallet({
      merchant: session.merchant,
      userId: session.user.id,
      walletAddress: body.walletAddress,
      issuedAt: session.issuedAt,
    });
    return json({ requestId, walletAddress: merchant.walletAddress });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}
