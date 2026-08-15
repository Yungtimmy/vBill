"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button, Input, Label } from "@/components/ui";
import { useAccountBootstrap } from "@/components/bootstrap";
import { api, formatError } from "@/lib/client-api";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";

export default function SettingsPage() {
  if (!isPrivyConfigured()) return <MissingConfig feature="Settings" />;
  return <SettingsInner />;
}

function SettingsInner() {
  const { readyOnServer } = useAccountBootstrap();
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [wallet, setWallet] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!readyOnServer) return;
    api<{
      settings: { businessName: string; businessEmail?: string | null; walletAddress: string };
    }>("/api/settings")
      .then((d) => {
        setBusinessName(d.settings.businessName);
        setBusinessEmail(d.settings.businessEmail ?? "");
        setWallet(d.settings.walletAddress);
      })
      .catch((err) => setError(formatError(err)));
  }, [readyOnServer]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          businessName,
          businessEmail: businessEmail || undefined,
        }),
      });
      setSaved(true);
    } catch (err) {
      setError(formatError(err));
    }
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-medium tracking-tight mb-8">Settings</h1>
      <form onSubmit={onSubmit} className="max-w-xl space-y-6">
        <div>
          <Label>Business name</Label>
          <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        </div>
        <div>
          <Label>Business email</Label>
          <Input type="email" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} />
        </div>
        <div>
          <Label>Payment wallet</Label>
          <p className="font-mono text-sm break-all text-[#6B6B6B] mb-3">{wallet || "—"}</p>
          <Link href="/settings/wallet" className="text-sm underline text-[#0C7A4D]">
            Change payment wallet
          </Link>
        </div>
        {error && <p className="text-[#C23B3B]">{error}</p>}
        {saved && <p className="text-[#0C7A4D]">Saved.</p>}
        <Button type="submit">Save</Button>
      </form>
    </AppShell>
  );
}
