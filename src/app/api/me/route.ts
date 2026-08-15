import { NextRequest } from "next/server";
import { errorResponse, getRequestId, json } from "@/lib/api";
import { extractAccessToken, requireSession, upsertUserFromPrivy, verifyAccessToken } from "@/lib/auth";
import { bootstrapSchema } from "@/lib/validation";
import { assertSafeMutation } from "@/lib/guard";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { writeAudit } from "@/server/audit";
import { UnauthorizedError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  try {
    const session = await requireSession(req.headers);
    return json({
      requestId,
      user: {
        id: session.user.id,
        email: session.user.email,
        walletAddress: session.user.walletAddress,
        role: session.user.role,
      },
      merchant: {
        id: session.merchant.id,
        businessName: session.merchant.businessName,
        businessEmail: session.merchant.businessEmail,
        walletAddress: session.merchant.walletAddress,
      },
    });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  try {
    assertSafeMutation(req.headers);
    await rateLimit({ key: `me:${clientIp(req.headers)}`, limit: 20, windowMs: 60_000 });
    const token = extractAccessToken(req.headers);
    if (!token) throw new UnauthorizedError();
    const { userId } = await verifyAccessToken(token);
    const body = bootstrapSchema.parse(await req.json().catch(() => ({})));
    const session = await upsertUserFromPrivy({
      privyUserId: userId,
      email: body.email,
      walletAddress: body.walletAddress,
      businessName: body.businessName,
    });
    await writeAudit({
      userId: session.user.id,
      event: "USER_CREATED",
      metadata: { merchantId: session.merchant.id },
    });
    return json({
      requestId,
      user: {
        id: session.user.id,
        email: session.user.email,
        walletAddress: session.user.walletAddress,
        role: session.user.role,
      },
      merchant: {
        id: session.merchant.id,
        businessName: session.merchant.businessName,
        walletAddress: session.merchant.walletAddress,
      },
    });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}
