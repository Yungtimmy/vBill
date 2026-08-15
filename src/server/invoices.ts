import type { Invoice, InvoiceItem, InvoiceStatus, Merchant } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getChainConfig } from "@/lib/chain";
import { formatInvoiceNumber, newPublicId } from "@/lib/crypto-ids";
import { multiplyQuantity, parseQuantity, parseVerseAmount } from "@/lib/amounts";
import { assertTransition } from "@/lib/invoice-status";
import { isExpired } from "@/lib/time";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/server/audit";
import { trackEvent } from "@/server/analytics";
import { nowUtc } from "@/lib/time";
import type { z } from "zod";
import type { createInvoiceSchema, updateDraftInvoiceSchema } from "@/lib/validation";

type CreateInput = z.infer<typeof createInvoiceSchema>;
type UpdateInput = z.infer<typeof updateDraftInvoiceSchema>;

function lineItems(items: CreateInput["items"], decimals: number) {
  return items.map((item) => {
    const qty = parseQuantity(item.quantity);
    const unit = parseVerseAmount(item.unitPrice, decimals);
    const total = multiplyQuantity(unit, qty);
    return {
      description: item.description,
      quantity: qty.toString(),
      unitPrice: item.unitPrice.trim(),
      total: total.toString(),
      totalBig: total,
    };
  });
}

export async function createInvoice(merchant: Merchant, userId: string, input: CreateInput) {
  const cfg = getChainConfig();
  if (!merchant.walletAddress) {
    throw new AppError("NO_WALLET", "Set a payment wallet before creating invoices.", 409);
  }

  const lines = lineItems(input.items, cfg.tokenDecimals);
  const amount = lines.reduce((s, l) => s + l.totalBig, 0n);
  if (amount <= 0n) {
    throw new AppError("INVALID_AMOUNT", "Invoice total must be greater than zero.", 400);
  }

  const dueDate = input.dueDate ? new Date(input.dueDate) : null;
  if (dueDate && Number.isNaN(dueDate.getTime())) {
    throw new AppError("INVALID_DATE", "Due date is invalid.", 400);
  }
  if (dueDate && dueDate.getTime() < nowUtc().getTime() - 60_000) {
    throw new AppError("INVALID_DATE", "Due date must be in the future.", 400);
  }

  const invoice = await prisma.$transaction(async (tx) => {
    const updated = await tx.merchant.update({
      where: { id: merchant.id },
      data: { invoiceSeq: { increment: 1 } },
      select: { invoiceSeq: true, walletAddress: true },
    });

    return tx.invoice.create({
      data: {
        publicId: newPublicId(),
        invoiceNumber: formatInvoiceNumber(updated.invoiceSeq),
        merchantId: merchant.id,
        customerId: input.customerId,
        customerName: input.customerName,
        customerEmail: input.customerEmail ?? null,
        currency: cfg.tokenSymbol,
        amountBaseUnits: amount.toString(),
        tokenAddress: cfg.tokenAddress,
        chainId: cfg.chainId,
        merchantWallet: updated.walletAddress,
        status: input.publish ? "PENDING" : "DRAFT",
        dueDate,
        notes: input.notes ?? null,
        items: {
          create: lines.map((line) => ({
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            total: line.total,
          })),
        },
      },
      include: { items: true, merchant: true, payments: true },
    });
  });

  await writeAudit({
    userId,
    invoiceId: invoice.id,
    event: "INVOICE_CREATED",
    metadata: { invoiceNumber: invoice.invoiceNumber, status: invoice.status },
  });
  await trackEvent("invoice_created", { status: invoice.status });
  return invoice;
}

export async function updateDraft(
  merchantId: string,
  invoiceId: string,
  input: UpdateInput,
) {
  const invoice = await getOwnedInvoice(merchantId, invoiceId);
  if (invoice.status !== "DRAFT") {
    throw new AppError(
      "IMMUTABLE",
      "Active invoices cannot change amount, token, chain, or destination. Create a new invoice.",
      409,
    );
  }

  const cfg = getChainConfig();
  const data: Record<string, unknown> = {};
  if (input.customerName) data.customerName = input.customerName;
  if (input.customerEmail !== undefined) data.customerEmail = input.customerEmail ?? null;
  if (input.customerId !== undefined) data.customerId = input.customerId;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.dueDate !== undefined) {
    data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  }

  if (input.items) {
    const lines = lineItems(input.items, cfg.tokenDecimals);
    const amount = lines.reduce((s, l) => s + l.totalBig, 0n);
    await prisma.$transaction([
      prisma.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } }),
      prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          ...data,
          amountBaseUnits: amount.toString(),
          tokenAddress: cfg.tokenAddress,
          chainId: cfg.chainId,
          items: {
            create: lines.map((line) => ({
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              total: line.total,
            })),
          },
        },
      }),
    ]);
  } else {
    await prisma.invoice.update({ where: { id: invoice.id }, data });
  }

  return getOwnedInvoice(merchantId, invoiceId);
}

export async function publishInvoice(merchantId: string, invoiceId: string, userId: string) {
  const invoice = await getOwnedInvoice(merchantId, invoiceId);
  assertTransition(invoice.status, "PENDING");
  if (!invoice.items.length) {
    throw new AppError("INVALID", "Add at least one line item.", 400);
  }
  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: "PENDING" },
    include: { items: true, merchant: true, payments: true },
  });
  await writeAudit({
    userId,
    invoiceId: invoice.id,
    event: "INVOICE_CREATED",
    metadata: { action: "published" },
  });
  return updated;
}

export async function cancelInvoice(merchantId: string, invoiceId: string, userId: string) {
  const invoice = await getOwnedInvoice(merchantId, invoiceId);
  assertTransition(invoice.status, "CANCELLED");
  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: "CANCELLED" },
    include: { items: true, merchant: true, payments: true },
  });
  await writeAudit({
    userId,
    invoiceId: invoice.id,
    event: "INVOICE_CANCELLED",
  });
  return updated;
}

export async function getOwnedInvoice(merchantId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true, merchant: true, payments: true, customer: true },
  });
  if (!invoice) throw new NotFoundError();
  if (invoice.merchantId !== merchantId) throw new ForbiddenError();
  return maybeExpire(invoice);
}

export async function listInvoices(
  merchantId: string,
  opts: { status?: InvoiceStatus | "ALL"; take?: number; cursor?: string },
) {
  const take = opts.take ?? 20;
  const status = !opts.status || opts.status === "ALL" ? undefined : opts.status;
  return prisma.invoice.findMany({
    where: { merchantId, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    include: { items: true, payments: { where: { status: "CONFIRMED" } } },
  });
}

export async function getPublicInvoice(publicId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { publicId },
    include: {
      items: true,
      merchant: true,
      payments: {
        where: { status: { in: ["CONFIRMED", "PROCESSING"] } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!invoice) throw new NotFoundError("Invoice not found.");
  if (invoice.status === "DRAFT") throw new NotFoundError("Invoice not found.");
  return maybeExpire(invoice);
}

async function maybeExpire<
  T extends { id: string; status: InvoiceStatus; dueDate: Date | null },
>(invoice: T): Promise<T> {
  if (
    (invoice.status === "PENDING" || invoice.status === "UNDERPAID") &&
    isExpired(invoice.dueDate)
  ) {
    assertTransition(invoice.status, "EXPIRED");
    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "EXPIRED" },
    });
    return { ...invoice, status: updated.status };
  }
  return invoice;
}

export function publicInvoiceView(invoice: Invoice & { items: InvoiceItem[]; merchant: Merchant }) {
  const cfgSafe = {
    chainId: invoice.chainId,
    tokenAddress: invoice.tokenAddress,
    merchantWallet: invoice.merchantWallet,
    amountBaseUnits: invoice.amountBaseUnits,
    currency: invoice.currency,
  };
  return {
    publicId: invoice.publicId,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    businessName: invoice.merchant.businessName || "Merchant",
    customerName: invoice.customerName,
    items: invoice.items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: i.total,
    })),
    dueDate: invoice.dueDate,
    notes: invoice.notes,
    ...cfgSafe,
  };
}
