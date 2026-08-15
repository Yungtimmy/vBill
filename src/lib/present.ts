import { formatVerseAmount, parseBaseUnits } from "@/lib/amounts";
import { getChainConfig } from "@/lib/chain";

export function displayAmount(baseUnits: string, decimals?: number): string {
  const d = decimals ?? safeDecimals();
  try {
    return formatVerseAmount(parseBaseUnits(baseUnits), d);
  } catch {
    return "—";
  }
}

function safeDecimals(): number {
  try {
    return getChainConfig().tokenDecimals;
  } catch {
    return 18;
  }
}

export function statusLabel(status: string): string {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "PENDING":
      return "Ready to pay";
    case "PROCESSING":
      return "Checking the blockchain";
    case "PAID":
      return "Verified on-chain";
    case "UNDERPAID":
      return "Underpaid";
    case "OVERPAID":
      return "Overpaid";
    case "EXPIRED":
      return "Expired";
    case "CANCELLED":
      return "Cancelled";
    case "FAILED":
      return "Payment failed";
    default:
      return status;
  }
}
