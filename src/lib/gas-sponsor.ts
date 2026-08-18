import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  parseEther,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getChainConfig } from "@/lib/chain";
import { AppError, ConfigurationError } from "@/lib/errors";
import { logger } from "@/lib/logger";

const MIN_POL = parseEther("0.015");

function sponsorKey(): Hex | null {
  const raw = (process.env.GAS_SPONSOR_PRIVATE_KEY ?? "").trim();
  if (!raw) return null;
  const key = raw.startsWith("0x") ? raw : `0x${raw}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
    throw new ConfigurationError("GAS_SPONSOR_PRIVATE_KEY is not a valid private key.");
  }
  return key as Hex;
}

function topUpAmount(): bigint {
  const raw = (process.env.GAS_SPONSOR_TOP_UP_POL ?? "0.02").trim();
  try {
    const value = parseEther(raw);
    if (value <= 0n || value > parseEther("0.2")) {
      throw new Error("out of range");
    }
    return value;
  } catch {
    throw new ConfigurationError("GAS_SPONSOR_TOP_UP_POL must be a POL amount between 0 and 0.2.");
  }
}

export function gasSponsorEnabled(): boolean {
  try {
    return Boolean(sponsorKey());
  } catch {
    return false;
  }
}

export async function fundPayerGas(to: Address): Promise<{
  sponsored: boolean;
  alreadyFunded: boolean;
  txHash: string | null;
}> {
  const key = sponsorKey();
  if (!key) {
    return { sponsored: false, alreadyFunded: false, txHash: null };
  }

  const cfg = getChainConfig();
  const account = privateKeyToAccount(key);
  const chain = defineChain({
    id: cfg.chainId,
    name: cfg.chainName,
    nativeCurrency: { name: cfg.gasToken, symbol: cfg.gasToken, decimals: 18 },
    rpcUrls: { default: { http: [cfg.rpcUrl] } },
  });
  const transport = http(cfg.rpcUrl, { timeout: 20_000 });
  const publicClient = createPublicClient({ chain, transport });
  const walletClient = createWalletClient({ account, chain, transport });

  const payerBal = await publicClient.getBalance({ address: to });
  if (payerBal >= MIN_POL) {
    return { sponsored: true, alreadyFunded: true, txHash: null };
  }

  const send = topUpAmount();
  const sponsorBal = await publicClient.getBalance({ address: account.address });
  if (sponsorBal < send + parseEther("0.002")) {
    logger.warn("gas_sponsor_empty", { chainId: cfg.chainId });
    throw new AppError(
      "SPONSOR_UNFUNDED",
      "VerseBill could not sponsor gas right now. Add POL to the sponsor wallet or try again.",
      503,
    );
  }

  const txHash = await walletClient.sendTransaction({
    to,
    value: send,
    account,
    chain,
  });
  await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 });
  return { sponsored: true, alreadyFunded: false, txHash };
}
