import type { Merchant } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeAddress } from "@/lib/addresses";
import { AppError } from "@/lib/errors";
import { isFreshAuth } from "@/lib/authz";
import { writeAudit } from "@/server/audit";

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

export async function changeWallet(input: {
  merchant: Merchant;
  userId: string;
  walletAddress: string;
  issuedAt?: number;
}) {
  const maxAge = Number.parseInt(process.env.WALLET_CHANGE_MAX_AGE_SECONDS ?? "600", 10);
  if (!isFreshAuth(input.issuedAt, Number.isFinite(maxAge) ? maxAge : 600)) {
    throw new AppError(
      "STALE_AUTH",
      "Wallet changes require a recently authenticated session. Sign in again, then retry.",
      401,
    );
  }

  const next = normalizeAddress(input.walletAddress);
  await writeAudit({
    userId: input.userId,
    event: "WALLET_CHANGE_REQUESTED",
    metadata: { from: input.merchant.walletAddress, to: next },
  });

  const updated = await prisma.merchant.update({
    where: { id: input.merchant.id },
    data: { walletAddress: next },
  });

  await prisma.user.update({
    where: { id: input.userId },
    data: { walletAddress: next },
  });

  await writeAudit({
    userId: input.userId,
    event: "WALLET_CHANGED",
    metadata: { to: next },
  });

  return updated;
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
