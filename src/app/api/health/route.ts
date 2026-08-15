import { json } from "@/lib/api";
import { getChainConfig } from "@/lib/chain";

export async function GET() {
  let payments: "ready" | "not_configured" = "not_configured";
  let networkMode: string | null = process.env.VERSE_NETWORK_MODE ?? null;
  try {
    const cfg = getChainConfig();
    payments = "ready";
    networkMode = cfg.mode;
  } catch {
    payments = "not_configured";
  }
  return json({
    ok: true,
    privyPublicConfigured: Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID),
    privySecretConfigured: Boolean(process.env.PRIVY_APP_SECRET),
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    payments,
    networkMode,
    verseAnalyticsConfigured: Boolean(
      process.env.VERSE_ANALYTICS_ENDPOINT && process.env.VERSE_ANALYTICS_KEY,
    ),
  });
}
