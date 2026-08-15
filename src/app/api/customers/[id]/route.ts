import { NextRequest } from "next/server";
import { errorResponse, getRequestId, json } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { assertSafeMutation } from "@/lib/guard";
import { updateCustomerSchema } from "@/lib/validation";
import { getOwnedCustomer, updateCustomer } from "@/server/customers";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const requestId = getRequestId(req.headers);
  try {
    const session = await requireSession(req.headers);
    const { id } = await ctx.params;
    const customer = await getOwnedCustomer(session.merchant.id, id);
    return json({ requestId, customer });
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
    const body = updateCustomerSchema.parse(await req.json());
    const customer = await updateCustomer(session.merchant.id, id, {
      name: body.name,
      email: body.email,
    });
    return json({ requestId, customer });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}
