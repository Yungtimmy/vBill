import type { Merchant } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function updateProfile(
  merchant: Merchant,
  input: { businessName?: string; businessEmail?: string; logo?: string },
) {
  return prisma.merchant.update({
    where: { id: merchant.id },
    data: {
      ...(input.businessName ? { businessName: input.businessName } : {}),
      ...(input.businessEmail !== undefined ? { businessEmail: input.businessEmail ?? null } : {}),
      ...(input.logo !== undefined ? { logo: input.logo || null } : {}),
    },
  });
}

export async function dashboardStats(merchantId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { merchantId },
    select: { status: true, amountBaseUnits: true },
  });
  let invoiced = 0n;
  let paid = 0n;
  let pending = 0n;
  let paidCount = 0;
  let overdueCount = 0;
  let pendingInvoiceCount = 0;
  for (const inv of invoices) {
    const amt = BigInt(inv.amountBaseUnits);
    invoiced += amt;
    if (inv.status === "PAID" || inv.status === "OVERPAID") {
      paid += amt;
      paidCount += 1;
    }
    if (inv.status === "PENDING" || inv.status === "PROCESSING" || inv.status === "UNDERPAID") {
      pending += amt;
      pendingInvoiceCount += 1;
    }
    if (inv.status === "EXPIRED") overdueCount += 1;
  }
  return {
    invoiceCount: invoices.length,
    paidCount,
    overdueCount,
    pendingInvoiceCount,
    invoicedBaseUnits: invoiced.toString(),
    paidBaseUnits: paid.toString(),
    pendingBaseUnits: pending.toString(),
  };
}
