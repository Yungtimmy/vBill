import { NextRequest } from "next/server";
import { errorResponse, getRequestId, json } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { assertSafeMutation } from "@/lib/guard";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createInvoiceSchema, invoiceListQuerySchema } from "@/lib/validation";
import { createInvoice, listInvoices } from "@/server/invoices";

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  try {
    const session = await requireSession(req.headers);
    const query = invoiceListQuerySchema.parse(
      Object.fromEntries(req.nextUrl.searchParams.entries()),
    );
    const rows = await listInvoices(session.merchant.id, {
      status: query.status,
      take: query.take,
      cursor: query.cursor,
    });
    const take = query.take ?? 20;
    const nextCursor = rows.length > take ? rows[take]!.id : null;
    return json({ requestId, invoices: rows.slice(0, take), nextCursor });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  try {
    assertSafeMutation(req.headers);
    const session = await requireSession(req.headers);
    await rateLimit({
      key: `invoice-create:${session.user.id}`,
      limit: 30,
      windowMs: 60_000,
    });
    await rateLimit({
      key: `invoice-create-ip:${clientIp(req.headers)}`,
      limit: 40,
      windowMs: 60_000,
    });
    const body = createInvoiceSchema.parse(await req.json());
    const invoice = await createInvoice(session.merchant, session.user.id, body);
    return json({ requestId, invoice }, { status: 201 });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}
