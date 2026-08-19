import { NextRequest } from "next/server";
import { errorResponse, getRequestId, json } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getVerseUsdQuote, quoteToPublic } from "@/server/verse-price";

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  try {
    await requireSession(req.headers);
    await rateLimit({
      key: `verse-price:${clientIp(req.headers)}`,
      limit: 30,
      windowMs: 60_000,
    });
    const quote = await getVerseUsdQuote();
    return json({ requestId, ...quoteToPublic(quote) });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}
