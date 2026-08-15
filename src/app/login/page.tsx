"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui";
import { useAccountBootstrap } from "@/components/bootstrap";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";

export default function LoginPage() {
  if (!isPrivyConfigured()) {
    return <MissingConfig feature="Sign in" />;
  }
  return <LoginInner />;
}

function LoginInner() {
  const { ready, authenticated, login } = usePrivy();
  const { readyOnServer, error } = useAccountBootstrap();
  const router = useRouter();
  const configured = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);

  useEffect(() => {
    if (authenticated && readyOnServer) {
      router.replace("/dashboard");
    }
  }, [authenticated, readyOnServer, router]);

  return (
    <div className="min-h-[80vh] flex items-center">
      <div className="max-w-xl mx-auto px-6 py-28">
        <p className="font-mono text-xs tracking-[0.2em] text-[#6C6C74] uppercase mb-6">
          Sign in
        </p>
        <h1 className="font-[family-name:var(--font-syne)] text-4xl md:text-5xl tracking-tight mb-6">
          Continue with email
        </h1>
        <p className="text-[#A0A0AB] text-lg leading-relaxed mb-10">
          An embedded Verse wallet is created for you. You will not be asked for a seed phrase.
        </p>
        {!configured ? (
          <p className="text-[#C45C5C]">
            Privy is not configured. Set NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET.
          </p>
        ) : (
          <Button onClick={() => login()} disabled={!ready}>
            {authenticated ? "Preparing your wallet" : "Continue with email or wallet"}
          </Button>
        )}
        {authenticated && !error && (
          <p className="mt-6 text-[#6F8F72]">Your Verse wallet is ready.</p>
        )}
        {error && <p className="mt-6 text-[#C45C5C]">{error}</p>}
      </div>
    </div>
  );
}
