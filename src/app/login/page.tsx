"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui";
import { PublicFrame } from "@/components/public-frame";
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

  useEffect(() => {
    if (authenticated && readyOnServer) {
      router.replace("/dashboard");
    }
  }, [authenticated, readyOnServer, router]);

  return (
    <PublicFrame>
      <div className="max-w-md mx-auto pt-10">
        <h1 className="text-3xl font-medium tracking-tight mb-3">Continue with email</h1>
        <p className="text-[#6B6B6B] mb-8 leading-relaxed">
          An embedded wallet is created for you. You will not be asked for a seed phrase.
        </p>
        <Button onClick={() => login()} disabled={!ready} className="w-full">
          {authenticated ? "Preparing your wallet" : "Continue with email"}
        </Button>
        {authenticated && !error && (
          <p className="mt-6 text-[#0C7A4D]">Your Verse wallet is ready.</p>
        )}
        {error && <p className="mt-6 text-[#C23B3B]">{error}</p>}
      </div>
    </PublicFrame>
  );
}
