import { ConfigurationError } from "@/lib/errors";
import type { Address, Hex } from "viem";
import { getAddress, isAddress } from "viem";

export type NetworkMode = "demo" | "production";

export type ChainConfig = {
  mode: NetworkMode;
  chainId: number;
  chainName: string;
  tokenAddress: Address;
  tokenDecimals: number;
  tokenSymbol: string;
  explorerUrl: string;
  gasToken: string;
  requiredConfirmations: number;
  rpcUrl: string;
};

const PRODUCTION_TOKEN = "0xc708d6f2153933daa50b2d0758955be0a93a8fec";
const PRODUCTION_CHAIN_ID = 137;

function required(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new ConfigurationError(`${name} is not configured.`);
  }
  return v.trim();
}

function optional(name: string, fallback: string): string {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : fallback;
}

function intEnv(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v || !v.trim()) return fallback;
  const n = Number.parseInt(v, 10);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ConfigurationError(`${name} must be a positive integer.`);
  }
  return n;
}

function tokenEnv(name: string, fallback: string): Address {
  const raw = optional(name, fallback);
  if (!isAddress(raw, { strict: false })) {
    throw new ConfigurationError(`${name} is not a valid address.`);
  }
  return getAddress(raw);
}

export function getNetworkMode(): NetworkMode {
  const raw = (process.env.VERSE_NETWORK_MODE ?? "demo").trim().toLowerCase();
  if (raw !== "demo" && raw !== "production") {
    throw new ConfigurationError("VERSE_NETWORK_MODE must be demo or production.");
  }
  return raw;
}

export function getChainConfig(): ChainConfig {
  const mode = getNetworkMode();

  if (mode === "production") {
    const tokenAddress = tokenEnv("VERSE_TOKEN_ADDRESS", PRODUCTION_TOKEN);
    const chainId = intEnv("VERSE_CHAIN_ID", PRODUCTION_CHAIN_ID);
    if (chainId !== PRODUCTION_CHAIN_ID) {
      throw new ConfigurationError(
        "Production mode must use Polygon PoS chain ID 137.",
      );
    }
    if (tokenAddress.toLowerCase() !== PRODUCTION_TOKEN) {
      throw new ConfigurationError(
        "Production mode must use the official VERSE token contract.",
      );
    }
    return {
      mode,
      chainId,
      chainName: optional("VERSE_CHAIN_NAME", "Polygon PoS"),
      tokenAddress,
      tokenDecimals: intEnv("VERSE_TOKEN_DECIMALS", 18),
      tokenSymbol: optional("VERSE_TOKEN_SYMBOL", "VERSE"),
      explorerUrl: optional("VERSE_EXPLORER_URL", "https://polygonscan.com").replace(
        /\/$/,
        "",
      ),
      gasToken: optional("VERSE_GAS_TOKEN", "POL"),
      requiredConfirmations: intEnv("VERSE_REQUIRED_CONFIRMATIONS", 30),
      rpcUrl: required("RPC_URL"),
    };
  }

  const demoToken = process.env.DEMO_TOKEN_ADDRESS;
  const demoChain = process.env.DEMO_CHAIN_ID;
  const demoRpc = process.env.DEMO_RPC_URL ?? process.env.RPC_URL;
  if (!demoToken || !demoChain || !demoRpc) {
    throw new ConfigurationError(
      "Demo mode requires DEMO_CHAIN_ID, DEMO_TOKEN_ADDRESS, and DEMO_RPC_URL (or RPC_URL).",
    );
  }
  if (!isAddress(demoToken, { strict: false })) {
    throw new ConfigurationError("DEMO_TOKEN_ADDRESS is not a valid address.");
  }

  return {
    mode,
    chainId: intEnv("DEMO_CHAIN_ID", 0),
    chainName: optional("DEMO_CHAIN_NAME", "Demo network"),
    tokenAddress: getAddress(demoToken),
    tokenDecimals: intEnv("DEMO_TOKEN_DECIMALS", 18),
    tokenSymbol: optional("DEMO_TOKEN_SYMBOL", "VERSE"),
    explorerUrl: optional("DEMO_EXPLORER_URL", "").replace(/\/$/, ""),
    gasToken: optional("DEMO_GAS_TOKEN", "POL"),
    requiredConfirmations: intEnv("DEMO_REQUIRED_CONFIRMATIONS", 5),
    rpcUrl: demoRpc.trim(),
  };
}

export function explorerTxUrl(explorerUrl: string, txHash: Hex | string): string {
  const base = explorerUrl.replace(/\/$/, "");
  return `${base}/tx/${txHash}`;
}

export function explorerAddressUrl(explorerUrl: string, address: string): string {
  const base = explorerUrl.replace(/\/$/, "");
  return `${base}/address/${address}`;
}

export function explorerTokenUrl(explorerUrl: string, token: string): string {
  const base = explorerUrl.replace(/\/$/, "");
  return `${base}/token/${token}`;
}

export const TRUSTED_PRODUCTION_TOKEN = PRODUCTION_TOKEN;
export const TRUSTED_PRODUCTION_CHAIN_ID = PRODUCTION_CHAIN_ID;
