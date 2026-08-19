import type { Invoice, InvoiceStatus, Merchant, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getAddress } from "viem";
import { formatUnits } from "viem";
import { getChainConfig } from "@/lib/chain";
import { formatInvoiceNumber, newPublicId } from "@/lib/crypto-ids";
import { multiplyQuantity, parseQuantity, parseVerseAmount } from "@/lib/amounts";
import { assertTransition } from "@/lib/invoice-status";
import { isExpired, nowUtc } from "@/lib/time";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { writeAudit } from "@/server/audit";
import { trackEvent } from "@/server/analytics";
import { getVerseUsdQuote, type VerseUsdQuote } from "@/server/verse-price";
import { meetsMinimumUsd, usdValueScaled } from "@/lib/verse-min";
import type { z } from "zod";
import type { createInvoiceSchema, updateDraftInvoiceSchema } from "@/lib/validation";

type CreateInput = z.infer<typeof createInvoiceSchema>;
type UpdateInput = z.infer<typeof updateDraftInvoiceSchema>;

export type LineItem = {
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
};

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
      amount: total,
    };
  });
}

function storedItems(lines: ReturnType<typeof lineItems>): LineItem[] {
  return lines.map((line) => ({
    description: line.description,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    total: line.total,
  }));
}

function readItems(value: Prisma.JsonValue | null | undefined): LineItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is LineItem => {
    if (!row || typeof row !== "object") return false;
    const r = row as Record<string, unknown>;
    return (
      typeof r.description === "string" &&
      typeof r.quantity === "string" &&
      typeof r.unitPrice === "string" &&
      typeof r.total === "string"
    );
  });
}

export function assertConfiguredVerse(cfg: ReturnType<typeof getChainConfig>, input: { tokenAddress?: string; chainId?: number }) {
  if (input.tokenAddress && getAddress(input.tokenAddress) !== cfg.tokenAddress) {
    throw new AppError("INVALID_TOKEN", "Only the configured VERSE token is supported.", 400);
  }
  if (input.chainId !== undefined && input.chainId !== cfg.chainId) {
    throw new AppError("INVALID_NETWORK", "Invoices must use the configured Polygon network.", 400);
  }
}

function belowMinimumMessage(quote: VerseUsdQuote): string {
  return `Minimum invoice amount is $${quote.minimumUsd} USD equivalent of VERSE. Current price: $${quote.priceUsd} / VERSE. Minimum: ~${quote.minimumVerse} VERSE.`;
}

export async function assertMinimumVerse(amountBaseUnits: bigint, cfg: ReturnType<typeof getChainConfig>) {
  const quote = await getVerseUsdQuote();
  if (!meetsMinimumUsd(amountBaseUnits, quote.priceScaled, quote.minimumUsdScaled, cfg.tokenDecimals)) {
    throw new AppError("BELOW_MINIMUM", belowMinimumMessage(quote), 400);
  }
  const usdScaled = usdValueScaled(amountBaseUnits, quote.priceScaled, cfg.tokenDecimals);
  return {
    quote,
    usdValue: formatUnits(usdScaled, 18),
  };
}

export async function createInvoice(merchant: Merchant, userId: string, input: CreateInput) {
  const cfg = getChainConfig();
  if (!merchant.walletAddress) {
    throw new AppError("NO_WALLET", "Set a payment wallet before creating invoices.", 409);
  }
  assertConfiguredVerse(cfg, input);

  const lines = lineItems(input.items, cfg.tokenDecimals);
  const amount = lines.reduce((s, l) => s + l.amount, 0n);
  if (amount <= 0n) {
    throw new AppError("INVALID_AMOUNT", "Invoice total must be greater than zero.", 400);
  }
  const priced = await assertMinimumVerse(amount, cfg);

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
        lineItems: storedItems(lines),
        priceUsdAtCreation: priced.quote.priceUsd,
        usdValueAtCreation: priced.usdValue,
        minimumUsdAtCreation: priced.quote.minimumUsd,
        priceSource: priced.quote.source,
        priceFetchedAt: priced.quote.fetchedAt,
      },
      include: { merchant: true, payments: true },
    });
  });

  await writeAudit({
    userId,
    invoiceId: invoice.id,
    event: "INVOICE_CREATED",
    metadata: { invoiceNumber: invoice.invoiceNumber, status: invoice.status },
  });
  await trackEvent("invoice_created", { status: invoice.status });
  return withItems(invoice);
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
  assertConfiguredVerse(cfg, {});
  const data: Prisma.InvoiceUpdateInput = {};
  if (input.customerName) data.customerName = input.customerName;
  if (input.customerEmail !== undefined) data.customerEmail = input.customerEmail ?? null;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.dueDate !== undefined) {
    data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  }

  if (input.items) {
    const lines = lineItems(input.items, cfg.tokenDecimals);
    const amount = lines.reduce((s, l) => s + l.amount, 0n);
    const priced = await assertMinimumVerse(amount, cfg);
    data.amountBaseUnits = amount.toString();
    data.tokenAddress = cfg.tokenAddress;
    data.chainId = cfg.chainId;
    data.lineItems = storedItems(lines);
    data.priceUsdAtCreation = priced.quote.priceUsd;
    data.usdValueAtCreation = priced.usdValue;
    data.minimumUsdAtCreation = priced.quote.minimumUsd;
    data.priceSource = priced.quote.source;
    data.priceFetchedAt = priced.quote.fetchedAt;
  }

  await prisma.invoice.update({ where: { id: invoice.id }, data });
  return getOwnedInvoice(merchantId, invoiceId);
}

export async function publishInvoice(merchantId: string, invoiceId: string, userId: string) {
  const invoice = await getOwnedInvoice(merchantId, invoiceId);
  assertTransition(invoice.status, "PENDING");
  if (!invoice.items.length) {
    throw new AppError("INVALID", "Add at least one line item.", 400);
  }
  const cfg = getChainConfig();
  await assertMinimumVerse(BigInt(invoice.amountBaseUnits), cfg);
  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: "PENDING" },
    include: { merchant: true, payments: true },
  });
  await writeAudit({
    userId,
    invoiceId: invoice.id,
    event: "INVOICE_CREATED",
    metadata: { action: "published" },
  });
  return withItems(updated);
}

export async function cancelInvoice(merchantId: string, invoiceId: string, userId: string) {
  const invoice = await getOwnedInvoice(merchantId, invoiceId);
  if (invoice.status === "PAID" || invoice.status === "OVERPAID" || invoice.status === "CANCELLED") {
    throw new AppError(
      "CANCEL_NOT_ALLOWED",
      "This invoice can't be cancelled in its current state.",
      409,
    );
  }
  assertTransition(invoice.status, "CANCELLED");
  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: "CANCELLED" },
    include: { merchant: true, payments: true },
  });
  await writeAudit({
    userId,
    invoiceId: invoice.id,
    event: "INVOICE_CANCELLED",
  });
  return withItems(updated);
}

export async function getOwnedInvoice(merchantId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { merchant: true, payments: true },
  });
  if (!invoice) throw new NotFoundError();
  if (invoice.merchantId !== merchantId) throw new ForbiddenError();
  return maybeExpire(withItems(invoice));
}

export async function listInvoices(
  merchantId: string,
  opts: { status?: InvoiceStatus | "ALL"; take?: number; cursor?: string },
) {
  const take = opts.take ?? 20;
  const status = !opts.status || opts.status === "ALL" ? undefined : opts.status;
  const rows = await prisma.invoice.findMany({
    where: { merchantId, status: { not: "CANCELLED" }, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    include: { payments: { where: { status: "CONFIRMED" } } },
  });
  return rows.map(withItems);
}

export async function getPublicInvoice(publicId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { publicId },
    include: {
      merchant: true,
      payments: {
        where: { status: { in: ["CONFIRMED", "PROCESSING"] } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!invoice) throw new NotFoundError("Invoice not found.");
  if (invoice.status === "DRAFT" || invoice.status === "CANCELLED") {
    throw new NotFoundError("Invoice not found.");
  }
  return maybeExpire(withItems(invoice));
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

export function withItems<T extends { lineItems: Prisma.JsonValue }>(
  invoice: T,
): T & { items: LineItem[] } {
  return { ...invoice, items: readItems(invoice.lineItems) };
}

export function publicInvoiceView(
  invoice: Invoice & { items: LineItem[]; merchant: Merchant },
) {
  return {
    publicId: invoice.publicId,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    businessName: invoice.merchant.businessName || "Merchant",
    customerName: invoice.customerName,
    items: invoice.items,
    dueDate: invoice.dueDate,
    notes: invoice.notes,
    chainId: invoice.chainId,
    tokenAddress: invoice.tokenAddress,
    merchantWallet: invoice.merchantWallet,
    amountBaseUnits: invoice.amountBaseUnits,
    currency: invoice.currency,
  };
}
