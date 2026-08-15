import type { Address, Hex, Log } from "viem";
import { decodeTransfers, sumTransfersTo } from "@/lib/erc20";
import { amountRelation } from "@/lib/amounts";
import { sameAddress } from "@/lib/addresses";

export type ReceiptLike = {
  status: "success" | "reverted" | "0x0" | "0x1" | 0 | 1;
  logs: readonly Log[];
  blockNumber: bigint;
  chainId?: number;
};

export type Evaluation =
  | { kind: "invalid"; code: string; message: string }
  | { kind: "pending"; message: string }
  | {
      kind: "accepted";
      from: Address;
      to: Address;
      amount: bigint;
      confirmations: number;
      relation: "exact" | "under" | "over";
      blockNumber: bigint;
    };

export function evaluatePayment(input: {
  configuredChainId: number;
  invoiceChainId: number;
  trustedToken: Address;
  invoiceToken: Address;
  merchantWallet: Address;
  expectedAmount: bigint;
  requiredConfirmations: number;
  currentBlock: bigint;
  transaction: { chainId?: number | bigint } | null;
  receipt: ReceiptLike | null;
}): Evaluation {
  if (input.invoiceChainId !== input.configuredChainId) {
    return { kind: "invalid", code: "WRONG_CHAIN", message: "Payment is not on the configured network." };
  }
  if (!sameAddress(input.invoiceToken, input.trustedToken)) {
    return {
      kind: "invalid",
      code: "WRONG_TOKEN",
      message: "Invoice token does not match the trusted VERSE contract.",
    };
  }
  if (!input.transaction && !input.receipt) {
    return {
      kind: "invalid",
      code: "TX_NOT_FOUND",
      message: "Transaction was not found on the configured network.",
    };
  }
  if (
    input.transaction?.chainId != null &&
    Number(input.transaction.chainId) !== input.configuredChainId
  ) {
    return { kind: "invalid", code: "WRONG_CHAIN", message: "Payment is not on the configured network." };
  }
  if (!input.receipt) {
    return { kind: "pending", message: "Waiting for the transaction receipt." };
  }
  if (!isSuccess(input.receipt.status)) {
    return { kind: "invalid", code: "TX_REVERTED", message: "Payment failed on-chain." };
  }

  const transfers = decodeTransfers(input.receipt.logs, input.trustedToken);
  if (transfers.length === 0) {
    return {
      kind: "invalid",
      code: "WRONG_TOKEN",
      message: "Payment detected, but the asset does not match this invoice.",
    };
  }

  const summed = sumTransfersTo(transfers, input.merchantWallet);
  if (summed.amount === 0n || !summed.to || !summed.from) {
    return {
      kind: "invalid",
      code: "WRONG_RECIPIENT",
      message:
        "Payment detected, but it was not sent to the merchant wallet assigned to this invoice.",
    };
  }

  const confirmations =
    input.currentBlock >= input.receipt.blockNumber
      ? Number(input.currentBlock - input.receipt.blockNumber) + 1
      : 0;

  if (confirmations < input.requiredConfirmations) {
    return { kind: "pending", message: "Confirmation pending." };
  }

  return {
    kind: "accepted",
    from: summed.from,
    to: summed.to,
    amount: summed.amount,
    confirmations,
    relation: amountRelation(summed.amount, input.expectedAmount),
    blockNumber: input.receipt.blockNumber,
  };
}

function isSuccess(status: ReceiptLike["status"]): boolean {
  return status === "success" || status === "0x1" || status === 1;
}

export function transferLog(input: {
  token: Address;
  from: Address;
  to: Address;
  amount: bigint;
}): Log {
  const topic0 = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" as Hex;
  const pad = (addr: string) => `0x${addr.slice(2).toLowerCase().padStart(64, "0")}` as Hex;
  const data = `0x${input.amount.toString(16).padStart(64, "0")}` as Hex;
  return {
    address: input.token,
    topics: [topic0, pad(input.from), pad(input.to)],
    data,
    blockHash: "0x1",
    blockNumber: 1n,
    logIndex: 0,
    transactionHash: "0x1",
    transactionIndex: 0,
    removed: false,
  } as Log;
}
