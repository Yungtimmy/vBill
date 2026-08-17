"use client";

import { FormEvent, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { AppShell } from "@/components/app-shell";
import { Button, Card, Input, Label } from "@/components/ui";
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
      <div className="max-w-xl">
        <h1 className="text-[28px] font-bold tracking-tight mb-3">Payment wallet</h1>
        <p className="text-[#747180] mb-6 leading-relaxed">
          Existing invoices keep their original destination. Only new invoices use the new wallet.
        </p>
        <Card>
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <Label>New destination address</Label>
              <Input
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x…"
                required
              />
            </div>
            {error && <p className="text-[#EF4444]">{error}</p>}
            {ok && <p className="text-[#16A866]">Wallet updated for future invoices.</p>}
            <Button type="submit">Update wallet</Button>
          </form>
        </Card>
        <Card className="mt-4">
          <p className="text-sm font-semibold mb-2">Embedded wallet</p>
          <p className="text-sm text-[#747180] mb-4">
            Export uses Privy’s official wallet export. VerseBill never asks for a seed phrase.
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
        </Card>
      </div>
    </AppShell>
  );
}
