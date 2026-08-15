"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client-api";

export function useAccountBootstrap() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [readyOnServer, setReadyOnServer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (!ready || !authenticated || ran.current) return;
    const wallet = wallets.find((w) => w.walletClientType === "privy") ?? wallets[0];
    if (!wallet) return;
    ran.current = true;
    const email = user?.email?.address ?? undefined;
    api("/api/me", {
      method: "POST",
      body: JSON.stringify({
        walletAddress: wallet.address,
        email,
      }),
    })
      .then(() => setReadyOnServer(true))
      .catch((err: unknown) => {
        ran.current = false;
        setError(err instanceof Error ? err.message : "Could not create your account.");
      });
  }, [ready, authenticated, wallets, user]);

  return { readyOnServer, error, wallet: wallets[0] };
}
