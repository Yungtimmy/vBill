"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAccessToken, usePrivy } from "@privy-io/react-auth";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";

export default function RefreshPage() {
  if (!isPrivyConfigured()) {
    return <MissingConfig feature="Session refresh" />;
  }
  return (
    <Suspense
      fallback={
        <main className="min-h-[50vh] flex items-center justify-center text-sm text-[#747180]">
          Loading
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
    <main className="min-h-[50vh] flex items-center justify-center text-sm text-[#747180]">
      Loading
    </main>
  );
}

function safeRedirect(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}
