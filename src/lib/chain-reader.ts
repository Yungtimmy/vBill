import {
  createPublicClient,
  http,
  type Hex,
  type Log,
  type Transaction,
  type TransactionReceipt,
} from "viem";
import { polygon } from "viem/chains";
import { getChainConfig, type ChainConfig } from "@/lib/chain";
import { ConfigurationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { normalizeTxHash } from "@/lib/addresses";

export type ChainRead = {
  configuredChainId: number;
  transaction: Transaction | null;
  receipt: TransactionReceipt | null;
  currentBlock: bigint;
};

export interface ChainReader {
  read(txHash: Hex): Promise<ChainRead>;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

export function createViemChainReader(config?: ChainConfig): ChainReader {
  const cfg = config ?? getChainConfig();
  if (!cfg.rpcUrl) {
    throw new ConfigurationError("POLYGON_RPC_URL is not configured.");
  }
  const client = createPublicClient({
    chain: cfg.chainId === 137 ? polygon : undefined,
    transport: http(cfg.rpcUrl, { timeout: 15_000 }),
  });

  return {
    async read(txHash: Hex): Promise<ChainRead> {
      const hash = normalizeTxHash(txHash);
      try {
        const [transaction, receipt, currentBlock] = await Promise.all([
          withTimeout(client.getTransaction({ hash }), 15_000, "getTransaction").catch(
            (err: unknown) => {
              const msg = err instanceof Error ? err.message : "";
              if (/not found|could not be found/i.test(msg)) return null;
              throw err;
            },
          ),
          withTimeout(client.getTransactionReceipt({ hash }), 15_000, "getTransactionReceipt").catch(
            (err: unknown) => {
              const msg = err instanceof Error ? err.message : "";
              if (/not found|could not be found/i.test(msg)) return null;
              throw err;
            },
          ),
          withTimeout(client.getBlockNumber(), 15_000, "getBlockNumber"),
        ]);
        return {
          configuredChainId: cfg.chainId,
          transaction,
          receipt,
          currentBlock,
        };
      } catch (err) {
        logger.error("rpc_failure", {
          reason: err instanceof Error ? err.name : "unknown",
        });
        throw new ConfigurationError(
          "The blockchain provider is unavailable. Payment was not marked paid.",
        );
      }
    },
  };
}

export function receiptLogs(receipt: TransactionReceipt): Log[] {
  return receipt.logs as Log[];
}
