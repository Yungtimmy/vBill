import { NextRequest } from "next/server";
import { errorResponse, getRequestId, json } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { publicIdSchema } from "@/lib/validation";
import { getPublicInvoice } from "@/server/invoices";
import { explorerTxUrl, getChainConfig } from "@/lib/chain";
import { displayAmount } from "@/lib/present";

type Ctx = { params: Promise<{ publicId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const requestId = getRequestId(req.headers);
  try {
    await rateLimit({
      key: `verify-get:${clientIp(req.headers)}`,
      limit: 60,
      windowMs: 60_000,
    });
    const { publicId } = await ctx.params;
    publicIdSchema.parse(publicId);
    const invoice = await getPublicInvoice(publicId);
    const cfg = getChainConfig();
    const confirmed = invoice.payments.filter((p) => p.status === "CONFIRMED");

    return json({
      requestId,
      networkMode: cfg.mode,
      proof: {
        invoiceNumber: invoice.invoiceNumber,
        publicId: invoice.publicId,
        status: invoice.status,
        verifiedOnChain: confirmed.length > 0 && (invoice.status === "PAID" || invoice.status === "OVERPAID" || invoice.status === "UNDERPAID"),
        amountDisplay: displayAmount(invoice.amountBaseUnits, cfg.tokenDecimals),
        tokenSymbol: cfg.tokenSymbol,
        tokenAddress: invoice.tokenAddress,
        chainId: invoice.chainId,
        chainName: cfg.chainName,
        merchantWallet: invoice.merchantWallet,
        businessName: invoice.merchant.businessName || "Merchant",
        payments: confirmed.map((p) => ({
          txHash: p.txHash,
          from: p.fromAddress,
          to: p.toAddress,
          amountDisplay: p.amountBaseUnits
            ? displayAmount(p.amountBaseUnits, cfg.tokenDecimals)
            : null,
          blockNumber: p.blockNumber,
          confirmations: p.confirmations,
          verifiedAt: p.verifiedAt,
          explorerUrl: explorerTxUrl(cfg.explorerUrl, p.txHash),
        })),
      },
    });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}
