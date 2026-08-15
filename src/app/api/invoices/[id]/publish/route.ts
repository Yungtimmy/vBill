import { NextRequest } from "next/server";
import { errorResponse, getRequestId, json } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { assertSafeMutation } from "@/lib/guard";
import { publishInvoice } from "@/server/invoices";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const requestId = getRequestId(req.headers);
  try {
    assertSafeMutation(req.headers);
    const session = await requireSession(req.headers);
    const { id } = await ctx.params;
    const invoice = await publishInvoice(session.merchant.id, id, session.user.id);
    return json({ requestId, invoice });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}
