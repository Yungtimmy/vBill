"use client";

import { FormEvent, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { AppShell } from "@/components/app-shell";
import { Button, Input, Label } from "@/components/ui";
import { useAccountBootstrap } from "@/components/bootstrap";
import { api, formatError } from "@/lib/client-api";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";

export default function WalletSettingsPage() {
  if (!isPrivyConfigured()) return <MissingConfig feature="Wallet settings" />;
  return <WalletSettingsInner />;
}

function WalletSettingsInner() {
  useAccountBootstrap();
  const { exportWallet } = usePrivy();
  const [walletAddress, setWalletAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    try {
      await api("/api/settings/wallet", {
        method: "PATCH",
        body: JSON.stringify({ walletAddress }),
      });
      setOk(true);
    } catch (err) {
      setError(formatError(err));
    }
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-medium tracking-tight mb-4">Payment wallet</h1>
      <p className="text-[#6B6B6B] max-w-xl mb-8 leading-relaxed">
        Existing invoices keep their original destination. Only new invoices use the new wallet.
        This requires a recently authenticated session.
      </p>
      <form onSubmit={onSubmit} className="max-w-xl space-y-6">
        <div>
          <Label>New destination address</Label>
          <Input
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x…"
            required
          />
        </div>
        {error && <p className="text-[#C23B3B]">{error}</p>}
        {ok && <p className="text-[#0C7A4D]">Wallet updated for future invoices.</p>}
        <Button type="submit">Update wallet</Button>
      </form>
      <div className="mt-16 max-w-xl">
        <p className="text-sm font-medium mb-2">Embedded wallet</p>
        <p className="text-[#6B6B6B] mb-4">
          Export uses Privy’s official wallet export. VerseBill never asks for a seed phrase or
          private key.
        </p>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            try {
              exportWallet();
            } catch {
              setError("Wallet export is not available in this session.");
            }
          }}
        >
          Export embedded wallet
        </Button>
      </div>
    </AppShell>
  );
}
