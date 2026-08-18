import { NextRequest } from "next/server";
import { errorResponse, getRequestId, json } from "@/lib/api";
import { gasSponsorEnabled } from "@/lib/gas-sponsor";

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  try {
    return json({ requestId, enabled: gasSponsorEnabled() });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}
