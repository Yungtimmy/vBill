"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAccessToken, usePrivy } from "@privy-io/react-auth";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";
import { Suspense } from "react";

export default function RefreshPage() {
  if (!isPrivyConfigured()) {
    return <MissingConfig feature="Session refresh" />;
  }
  return (
    <Suspense
      fallback={
        <main className="min-h-[50vh] flex items-center justify-center font-mono text-xs tracking-[0.2em] uppercase text-[#6C6C74]">
          Refreshing session
        </main>
      }
    >
      <RefreshInner />
    </Suspense>
  );
}

function RefreshInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { ready } = usePrivy();

  useEffect(() => {
    if (!ready) return;
    const target = safeRedirect(params.get("redirect_uri"));
    getAccessToken()
      .then((token) => {
        router.replace(token ? target : "/login");
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [params, ready, router]);

  return (
    <main className="min-h-[50vh] flex items-center justify-center font-mono text-xs tracking-[0.2em] uppercase text-[#6C6C74]">
      Refreshing session
    </main>
  );
}

function safeRedirect(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}
