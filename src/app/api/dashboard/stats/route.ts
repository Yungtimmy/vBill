import { NextRequest } from "next/server";
import { errorResponse, getRequestId, json } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { dashboardStats } from "@/server/merchants";
import { getChainConfig } from "@/lib/chain";
import { displayAmount } from "@/lib/present";

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  try {
    const session = await requireSession(req.headers);
    const stats = await dashboardStats(session.merchant.id);
    let decimals = 18;
    try {
      decimals = getChainConfig().tokenDecimals;
    } catch {
      decimals = 18;
    }
    return json({
      requestId,
      stats: {
        ...stats,
        invoicedDisplay: displayAmount(stats.invoicedBaseUnits, decimals),
        paidDisplay: displayAmount(stats.paidBaseUnits, decimals),
        pendingDisplay: displayAmount(stats.pendingBaseUnits, decimals),
      },
    });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}
