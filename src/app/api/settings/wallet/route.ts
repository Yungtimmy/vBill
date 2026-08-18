import { NextRequest } from "next/server";
import { errorResponse, getRequestId, json } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { getChainConfig } from "@/lib/chain";
import { createPublicClient, http, type Address } from "viem";
import { polygon } from "viem/chains";
import { erc20Abi } from "@/lib/erc20";
import { formatAmountRounded, parseBaseUnits } from "@/lib/amounts";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req.headers);
  try {
    const session = await requireSession(req.headers);
    const cfg = getChainConfig();
    const address = session.merchant.walletAddress as Address;

    let verseBaseUnits: string | null = null;
    let polBaseUnits: string | null = null;
    try {
      const client = createPublicClient({
        chain: cfg.chainId === 137 ? polygon : undefined,
        transport: http(cfg.rpcUrl, { timeout: 12_000 }),
      });
      const [verse, pol] = await Promise.all([
        client.readContract({
          address: cfg.tokenAddress,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address],
        }),
        client.getBalance({ address }),
      ]);
      verseBaseUnits = verse.toString();
      polBaseUnits = pol.toString();
    } catch (err) {
      logger.warn("wallet_balance_rpc_failed", {
        reason: err instanceof Error ? err.name : "unknown",
      });
    }

    return json({
      requestId,
      walletAddress: address,
      network: {
        chainId: cfg.chainId,
        chainName: cfg.chainName,
        tokenSymbol: cfg.tokenSymbol,
        tokenAddress: cfg.tokenAddress,
        tokenDecimals: cfg.tokenDecimals,
        gasToken: cfg.gasToken,
        explorerUrl: cfg.explorerUrl,
      },
      verseBaseUnits,
      polBaseUnits,
      verseDisplay: verseBaseUnits ? formatAmountRounded(parseBaseUnits(verseBaseUnits), cfg.tokenDecimals) : null,
      polDisplay: polBaseUnits ? formatAmountRounded(parseBaseUnits(polBaseUnits), 18) : null,
      balancesReachable: verseBaseUnits !== null,
    });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}
