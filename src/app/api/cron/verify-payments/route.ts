import { NextRequest } from "next/server";
import { errorResponse, getRequestId, json } from "@/lib/api";
import { UnauthorizedError } from "@/lib/errors";
import { processPendingPayments } from "@/server/worker";
import { timingSafeEqual } from "crypto";

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      throw new UnauthorizedError();
    }
    const header = req.headers.get("authorization") ?? "";
    const expected = `Bearer ${secret}`;
    const a = Buffer.from(header);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedError();
    }
    const result = await processPendingPayments();
    return json({ requestId, ...result });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}

export const POST = GET;
