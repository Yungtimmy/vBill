import { json } from "@/lib/api";
import { getChainConfig } from "@/lib/chain";
import { prisma } from "@/lib/db";
import { createPublicClient, http } from "viem";

export async function GET() {
  let payments: "ready" | "not_configured" = "not_configured";
  let networkMode: string | null = process.env.VERSE_NETWORK_MODE ?? null;
  let rpcReachable = false;
  let databaseReachable = false;

  try {
    const cfg = getChainConfig();
    payments = "ready";
    networkMode = cfg.mode;
    const client = createPublicClient({
      transport: http(cfg.rpcUrl, { timeout: 8_000 }),
    });
    const chainId = await client.getChainId();
    rpcReachable = chainId === cfg.chainId;
  } catch {
    payments = payments === "ready" ? "ready" : "not_configured";
  }

  if (process.env.DATABASE_URL) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseReachable = true;
    } catch {
      databaseReachable = false;
    }
  }

  return json({
    ok: true,
    privyPublicConfigured: Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID),
    privySecretConfigured: Boolean(process.env.PRIVY_APP_SECRET),
    privyVerificationKeyConfigured: Boolean(process.env.PRIVY_VERIFICATION_KEY),
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    databaseReachable,
    rpcReachable,
    payments,
    networkMode,
    verseAnalyticsConfigured: Boolean(
      process.env.VERSE_ANALYTICS_ENDPOINT && process.env.VERSE_ANALYTICS_KEY,
    ),
  });
}
