import { erc20Abi, parseEventLogs, type Address, type Log } from "viem";
import { normalizeAddress, sameAddress } from "@/lib/addresses";

export const TRANSFER_EVENT = "Transfer" as const;

export type DecodedTransfer = {
  token: Address;
  from: Address;
  to: Address;
  amount: bigint;
};

export function decodeTransfers(logs: readonly Log[], trustedToken: Address): DecodedTransfer[] {
  const trusted = normalizeAddress(trustedToken);
  const relevant = logs.filter((log) => sameAddress(log.address, trusted));
  if (relevant.length === 0) return [];

  const parsed = parseEventLogs({
    abi: erc20Abi,
    eventName: "Transfer",
    logs: relevant,
  });

  return parsed.map((ev) => ({
    token: trusted,
    from: ev.args.from,
    to: ev.args.to,
    amount: ev.args.value,
  }));
}

export function sumTransfersTo(transfers: DecodedTransfer[], recipient: Address): {
  amount: bigint;
  from: Address | null;
  to: Address | null;
} {
  const dest = normalizeAddress(recipient);
  let amount = 0n;
  let from: Address | null = null;
  let to: Address | null = null;
  for (const t of transfers) {
    if (sameAddress(t.to, dest)) {
      amount += t.amount;
      to = dest;
      from = t.from;
    }
  }
  return { amount, from, to };
}

export { erc20Abi };
