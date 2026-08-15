import type { Invoice, Payment } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getChainConfig } from "@/lib/chain";
import { createViemChainReader, type ChainReader } from "@/lib/chain-reader";
import { normalizeAddress, normalizeTxHash, sameAddress } from "@/lib/addresses";
import { parseBaseUnits } from "@/lib/amounts";
import { assertTransition, isPayable, statusFromTotals } from "@/lib/invoice-status";
import { AppError, ConflictError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { writeAudit } from "@/server/audit";
import { trackEvent } from "@/server/analytics";
import { evaluatePayment } from "@/lib/verify-rules";

export type VerifyOutcome = {
  payment: Payment;
  invoiceStatus: Invoice["status"];
  reason?: string;
};

export type VerifyDeps = {
  reader?: ChainReader;
  now?: Date;
};

export async function verifyPayment(
  paymentId: string,
  deps: VerifyDeps = {},
): Promise<VerifyOutcome> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { invoice: true },
  });
  if (!payment) {
    throw new AppError("NOT_FOUND", "Payment not found.", 404);
  }

  if (payment.status === "CONFIRMED") {
    return { payment, invoiceStatus: payment.invoice.status };
  }
  if (payment.status === "REJECTED" || payment.status === "FAILED") {
    return { payment, invoiceStatus: payment.invoice.status, reason: payment.rejectReason ?? undefined };
  }

  const cfg = getChainConfig();
  const reader = deps.reader ?? createViemChainReader(cfg);
  const txHash = normalizeTxHash(payment.txHash);

  await writeAudit({
    invoiceId: payment.invoiceId,
    event: "PAYMENT_VERIFICATION_STARTED",
    metadata: { paymentId, txHash },
  });

  let read;
  try {
    read = await reader.read(txHash);
  } catch (err) {
    logger.warn("verification_rpc_unavailable", { paymentId });
    throw err;
  }

  const expected = parseBaseUnits(payment.invoice.amountBaseUnits);
  const decision = evaluatePayment({
    configuredChainId: cfg.chainId,
    invoiceChainId: payment.invoice.chainId,
    trustedToken: cfg.tokenAddress,
    invoiceToken: normalizeAddress(payment.invoice.tokenAddress),
    merchantWallet: normalizeAddress(payment.invoice.merchantWallet),
    expectedAmount: expected,
    requiredConfirmations: cfg.requiredConfirmations,
    currentBlock: read.currentBlock,
    transaction: read.transaction,
    receipt: read.receipt,
  });

  if (decision.kind === "invalid") {
    if (decision.code === "TX_REVERTED") {
      return fail(payment, decision.code, decision.message);
    }
    return reject(payment, decision.code, decision.message);
  }

  if (decision.kind === "pending") {
    if (read.receipt) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          tokenAddress: cfg.tokenAddress,
          blockNumber: read.receipt.blockNumber.toString(),
          confirmations:
            read.currentBlock >= read.receipt.blockNumber
              ? Number(read.currentBlock - read.receipt.blockNumber) + 1
              : 0,
        },
      });
    }
    return stayProcessing(payment, decision.message);
  }

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Invoice" WHERE id = ${payment.invoiceId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM "Payment" WHERE id = ${payment.id} FOR UPDATE`;

    const locked = await tx.payment.findUniqueOrThrow({ where: { id: payment.id } });
    if (locked.status === "CONFIRMED") {
      const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: locked.invoiceId } });
      return { payment: locked, invoiceStatus: invoice.status };
    }

    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: {
        tokenAddress: cfg.tokenAddress,
        fromAddress: decision.from,
        toAddress: decision.to,
        amountBaseUnits: decision.amount.toString(),
        blockNumber: decision.blockNumber.toString(),
        confirmations: decision.confirmations,
      },
    });

    const nextInvoiceStatus = statusFromTotals(
      await confirmedTotalForInvoice(tx, payment.invoiceId, payment.id, decision.amount),
      expected,
    );

    return confirmInTx(tx, updated, nextInvoiceStatus, decision.relation);
  });
}

async function confirmedTotalForInvoice(
  db: Pick<typeof prisma, "payment">,
  invoiceId: string,
  currentPaymentId: string,
  currentAmount: bigint,
): Promise<bigint> {
  const others = await db.payment.findMany({
    where: {
      invoiceId,
      status: "CONFIRMED",
      id: { not: currentPaymentId },
    },
  });
  let total = currentAmount;
  for (const p of others) {
    if (p.amountBaseUnits) total += parseBaseUnits(p.amountBaseUnits);
  }
  return total;
}

async function confirmInTx(
  tx: Pick<typeof prisma, "payment" | "invoice">,
  payment: Payment,
  invoiceStatus: Invoice["status"],
  relation: "exact" | "under" | "over",
): Promise<VerifyOutcome> {
  const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: payment.invoiceId } });
  assertTransition(invoice.status, invoiceStatus);

  const updatedPayment = await tx.payment.update({
    where: { id: payment.id },
    data: {
      status: "CONFIRMED",
      verifiedAt: new Date(),
      rejectReason: null,
    },
  });
  await tx.invoice.update({
    where: { id: invoice.id },
    data: { status: invoiceStatus },
  });

  await writeAudit({
    invoiceId: invoice.id,
    event: "PAYMENT_VERIFIED",
    metadata: {
      paymentId: payment.id,
      txHash: payment.txHash,
      relation,
      invoiceStatus,
    },
  });
  await trackEvent(invoiceStatus === "PAID" ? "invoice_paid" : "payment_verified", {
    invoicePublicId: invoice.publicId,
    status: invoiceStatus,
  });

  return { payment: updatedPayment, invoiceStatus };
}

async function reject(
  payment: Payment,
  code: string,
  message: string,
): Promise<VerifyOutcome> {
  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: payment.invoiceId } });
  const next = invoice.status === "PROCESSING" ? "PENDING" : invoice.status;
  if (next !== invoice.status) {
    assertTransition(invoice.status, next);
  }

  const [updated] = await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: "REJECTED", rejectReason: code },
    }),
    prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: next },
    }),
  ]);

  await writeAudit({
    invoiceId: invoice.id,
    event: "PAYMENT_REJECTED",
    metadata: { paymentId: payment.id, code },
  });
  await trackEvent("payment_failed", { code });

  return { payment: updated, invoiceStatus: next, reason: message };
}

async function fail(
  payment: Payment,
  code: string,
  message: string,
): Promise<VerifyOutcome> {
  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: payment.invoiceId } });
  const next = invoice.status === "PROCESSING" ? "FAILED" : invoice.status;
  if (next !== invoice.status) {
    assertTransition(invoice.status, next);
  }

  const [updated] = await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", rejectReason: code },
    }),
    prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: next },
    }),
  ]);

  await writeAudit({
    invoiceId: invoice.id,
    event: "PAYMENT_REJECTED",
    metadata: { paymentId: payment.id, code },
  });
  await trackEvent("payment_failed", { code });

  return { payment: updated, invoiceStatus: next, reason: message };
}

async function stayProcessing(payment: Payment, reason: string): Promise<VerifyOutcome> {
  return { payment, invoiceStatus: "PROCESSING", reason };
}

export async function submitTransactionHash(input: {
  invoice: Invoice;
  txHash: string;
  fromAddress?: string;
}): Promise<Payment> {
  if (!isPayable(input.invoice.status) && input.invoice.status !== "PROCESSING") {
    throw new AppError("NOT_PAYABLE", "This invoice cannot accept a new payment.", 409);
  }

  const cfg = getChainConfig();
  if (input.invoice.chainId !== cfg.chainId) {
    throw new AppError("WRONG_CHAIN", "Invoice is not on the configured network.", 409);
  }
  if (!sameAddress(input.invoice.tokenAddress, cfg.tokenAddress)) {
    throw new AppError("WRONG_TOKEN", "Invoice token is not the trusted VERSE contract.", 409);
  }

  const txHash = normalizeTxHash(input.txHash);
  const existing = await prisma.payment.findUnique({
    where: { chainId_txHash: { chainId: cfg.chainId, txHash } },
  });
  if (existing) {
    if (existing.invoiceId !== input.invoice.id) {
      throw new ConflictError(
        "TX_REUSED",
        "This transaction has already been used for another invoice.",
      );
    }
    return existing;
  }

  try {
    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          invoiceId: input.invoice.id,
          txHash,
          chainId: cfg.chainId,
          tokenAddress: cfg.tokenAddress,
          fromAddress: input.fromAddress ? normalizeAddress(input.fromAddress) : null,
          status: "PROCESSING",
        },
      });
      if (input.invoice.status !== "PROCESSING") {
        assertTransition(input.invoice.status, "PROCESSING");
        await tx.invoice.update({
          where: { id: input.invoice.id },
          data: { status: "PROCESSING" },
        });
      }
      return created;
    });

    await writeAudit({
      invoiceId: input.invoice.id,
      event: "PAYMENT_SUBMITTED",
      metadata: { paymentId: payment.id, txHash },
    });
    await trackEvent("payment_submitted", { invoicePublicId: input.invoice.publicId });
    return payment;
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      const again = await prisma.payment.findUnique({
        where: { chainId_txHash: { chainId: cfg.chainId, txHash } },
      });
      if (again && again.invoiceId === input.invoice.id) return again;
      throw new ConflictError(
        "TX_REUSED",
        "This transaction has already been used for another invoice.",
      );
    }
    throw err;
  }
}
