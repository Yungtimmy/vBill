import { NextRequest } from "next/server";
import { errorResponse, getRequestId, json } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { publicIdSchema } from "@/lib/validation";
import { getPublicInvoice, publicInvoiceView } from "@/server/invoices";
import { getChainConfig, explorerAddressUrl, explorerTokenUrl } from "@/lib/chain";
import { displayAmount } from "@/lib/present";
import { trackEvent } from "@/server/analytics";
import { parseBaseUnits } from "@/lib/amounts";

type Ctx = { params: Promise<{ publicId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const requestId = getRequestId(req.headers);
  try {
    await rateLimit({
      key: `pay-get:${clientIp(req.headers)}`,
      limit: 60,
      windowMs: 60_000,
    });
    const { publicId } = await ctx.params;
    publicIdSchema.parse(publicId);
    const invoice = await getPublicInvoice(publicId);
    const cfg = getChainConfig();
    await trackEvent("invoice_viewed", { invoicePublicId: publicId });

    const confirmed = invoice.payments
      .filter((p) => p.status === "CONFIRMED" && p.amountBaseUnits)
      .reduce((s, p) => s + parseBaseUnits(p.amountBaseUnits!), 0n);

    return json({
      requestId,
      networkMode: cfg.mode,
      network: {
        chainId: cfg.chainId,
        chainName: cfg.chainName,
        tokenSymbol: cfg.tokenSymbol,
        tokenAddress: cfg.tokenAddress,
        tokenDecimals: cfg.tokenDecimals,
        gasToken: cfg.gasToken,
        explorerUrl: cfg.explorerUrl,
        requiredConfirmations: cfg.requiredConfirmations,
      },
      invoice: {
        ...publicInvoiceView(invoice),
        amountDisplay: displayAmount(invoice.amountBaseUnits, cfg.tokenDecimals),
        receivedBaseUnits: confirmed.toString(),
        receivedDisplay: displayAmount(confirmed.toString(), cfg.tokenDecimals),
        remainingBaseUnits:
          confirmed < parseBaseUnits(invoice.amountBaseUnits)
            ? (parseBaseUnits(invoice.amountBaseUnits) - confirmed).toString()
            : "0",
        remainingDisplay:
          confirmed < parseBaseUnits(invoice.amountBaseUnits)
            ? displayAmount(
                (parseBaseUnits(invoice.amountBaseUnits) - confirmed).toString(),
                cfg.tokenDecimals,
              )
            : "0",
        destinationExplorer: explorerAddressUrl(cfg.explorerUrl, invoice.merchantWallet),
        tokenExplorer: explorerTokenUrl(cfg.explorerUrl, invoice.tokenAddress),
        payments: invoice.payments.map((p) => ({
          id: p.id,
          status: p.status,
          txHash: p.txHash,
          amountBaseUnits: p.amountBaseUnits,
          rejectReason: p.rejectReason,
          confirmations: p.confirmations,
        })),
      },
    });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}
