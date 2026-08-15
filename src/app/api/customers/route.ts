import { NextRequest } from "next/server";
import { errorResponse, getRequestId, json } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { assertSafeMutation } from "@/lib/guard";
import { createCustomerSchema } from "@/lib/validation";
import { createCustomer, listCustomers } from "@/server/customers";

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  try {
    const session = await requireSession(req.headers);
    const customers = await listCustomers(session.merchant.id);
    return json({ requestId, customers });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  try {
    assertSafeMutation(req.headers);
    const session = await requireSession(req.headers);
    const body = createCustomerSchema.parse(await req.json());
    const customer = await createCustomer(session.merchant.id, {
      name: body.name,
      email: body.email,
    });
    return json({ requestId, customer }, { status: 201 });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}
