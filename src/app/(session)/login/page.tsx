"use client";

import { usePrivy, useLogin } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button, Spinner } from "@/components/ui";
import { PayCard, PublicFrame } from "@/components/public-frame";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";

export default function LoginPage() {
  if (!isPrivyConfigured()) {
    return <MissingConfig feature="Sign in" />;
  }
  return <LoginInner />;
}

function LoginInner() {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();
  const { login } = useLogin({
    onComplete: () => {
      router.replace("/dashboard");
    },
  });

  useEffect(() => {
    if (ready && authenticated) {
      router.replace("/dashboard");
    }
  }, [ready, authenticated, router]);

  return (
    <PublicFrame>
      <PayCard className="max-w-md mx-auto">
        <h1 className="text-[28px] font-bold tracking-tight mb-2">Continue with email</h1>
        <p className="text-muted mb-8 leading-relaxed">
          An embedded wallet is created for you. You will not be asked for a seed phrase.
        </p>
        <Button onClick={() => login()} disabled={!ready || authenticated} className="w-full">
          {!ready ? (
            <>
              <Spinner className="mr-2" /> Connecting…
            </>
          ) : (
            "Continue with email"
          )}
        </Button>
      </PayCard>
    </PublicFrame>
  );
}
