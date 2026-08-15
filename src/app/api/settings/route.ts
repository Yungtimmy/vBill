import { NextRequest } from "next/server";
import { errorResponse, getRequestId, json } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { assertSafeMutation } from "@/lib/guard";
import { updateSettingsSchema } from "@/lib/validation";
import { updateProfile } from "@/server/merchants";

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  try {
    const session = await requireSession(req.headers);
    return json({
      requestId,
      settings: {
        businessName: session.merchant.businessName,
        businessEmail: session.merchant.businessEmail,
        walletAddress: session.merchant.walletAddress,
      },
    });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}

export async function PATCH(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  try {
    assertSafeMutation(req.headers);
    const session = await requireSession(req.headers);
    const body = updateSettingsSchema.parse(await req.json());
    const merchant = await updateProfile(session.merchant, {
      businessName: body.businessName,
      businessEmail: body.businessEmail,
    });
    return json({ requestId, settings: merchant });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}
