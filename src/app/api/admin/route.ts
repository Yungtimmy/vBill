import { NextRequest } from "next/server";
import { errorResponse, getRequestId, json } from "@/lib/api";
import { requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  try {
    await requireRole(req.headers, "ADMIN");
    return json({ requestId, ok: true });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}
