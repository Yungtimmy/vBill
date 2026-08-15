import { NextRequest } from "next/server";
import { errorResponse, getRequestId, json } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { assertSafeMutation } from "@/lib/guard";
import { updateDraftInvoiceSchema } from "@/lib/validation";
import { getOwnedInvoice, updateDraft } from "@/server/invoices";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const requestId = getRequestId(req.headers);
  try {
    const session = await requireSession(req.headers);
    const { id } = await ctx.params;
    const invoice = await getOwnedInvoice(session.merchant.id, id);
    return json({ requestId, invoice });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const requestId = getRequestId(req.headers);
  try {
    assertSafeMutation(req.headers);
    const session = await requireSession(req.headers);
    const { id } = await ctx.params;
    const body = updateDraftInvoiceSchema.parse(await req.json());
    const invoice = await updateDraft(session.merchant.id, id, body);
    return json({ requestId, invoice });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}
