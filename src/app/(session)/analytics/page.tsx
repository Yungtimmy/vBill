"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui";
import { useAccountBootstrap } from "@/components/bootstrap";
import { api, formatError } from "@/lib/client-api";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";

type Stats = {
  invoiceCount: number;
  paidCount: number;
  overdueCount: number;
  pendingInvoiceCount: number;
  invoicedDisplay: string;
  paidDisplay: string;
  pendingDisplay: string;
};

export default function AnalyticsPage() {
  if (!isPrivyConfigured()) return <MissingConfig feature="Analytics" />;
  return <AnalyticsInner />;
}

function AnalyticsInner() {
  const { readyOnServer } = useAccountBootstrap();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!readyOnServer) return;
    api<{ stats: Stats }>("/api/dashboard/stats")
      .then((d) => setStats(d.stats))
      .catch((err) => setError(formatError(err)));
  }, [readyOnServer]);

  const rate =
    stats && stats.invoiceCount
      ? `${Math.round((stats.paidCount / stats.invoiceCount) * 100)}%`
      : "—";

  return (
    <AppShell>
      <h1 className="text-[28px] font-bold tracking-tight mb-2">Analytics</h1>
      <p className="text-sm text-[#747180] mb-6">Invoice volume and payment completion.</p>
      {error && <p className="text-[#EF4444] mb-4">{error}</p>}
      <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
        <Card>
          <p className="text-sm text-[#747180]">Invoiced</p>
          <p className="text-[28px] font-bold mt-3">{stats ? `${stats.invoicedDisplay} VERSE` : "—"}</p>
          <p className="text-sm text-[#747180] mt-2">{stats ? `${stats.invoiceCount} invoices` : ""}</p>
        </Card>
        <Card>
          <p className="text-sm text-[#747180]">Received</p>
          <p className="text-[28px] font-bold mt-3">{stats ? `${stats.paidDisplay} VERSE` : "—"}</p>
          <p className="text-sm text-[#747180] mt-2">{rate} paid</p>
        </Card>
        <Card>
          <p className="text-sm text-[#747180]">Outstanding</p>
          <p className="text-[28px] font-bold mt-3">{stats ? `${stats.pendingDisplay} VERSE` : "—"}</p>
          <p className="text-sm text-[#747180] mt-2">
            {stats ? `${stats.pendingInvoiceCount} open · ${stats.overdueCount} overdue` : ""}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-[#16A866]">Verified on-chain</p>
          <p className="text-[28px] font-bold mt-3">{stats?.paidCount ?? "—"}</p>
          <p className="text-sm text-[#16A866] mt-2">
            {stats && stats.paidCount > 0 ? "100% of paid invoices" : "No payments yet"}
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
