"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button, Card, StatusPill } from "@/components/ui";
import { useAccountBootstrap } from "@/components/bootstrap";
import { api, formatError } from "@/lib/client-api";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";
import { formatDate } from "@/lib/status";

type Stats = {
  invoiceCount: number;
  paidCount: number;
  overdueCount: number;
  invoicedDisplay: string;
  paidDisplay: string;
  pendingDisplay: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  status: string;
  createdAt: string;
};

export default function DashboardPage() {
  if (!isPrivyConfigured()) return <MissingConfig feature="The dashboard" />;
  return <DashboardInner />;
}

function DashboardInner() {
  const { readyOnServer, error: bootError } = useAccountBootstrap();
  const [stats, setStats] = useState<Stats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!readyOnServer) return;
    Promise.all([
      api<{ stats: Stats }>("/api/dashboard/stats"),
      api<{ invoices: Invoice[] }>("/api/invoices?take=8"),
    ])
      .then(([s, i]) => {
        setStats(s.stats);
        setInvoices(i.invoices);
      })
      .catch((err) => setError(formatError(err)));
  }, [readyOnServer]);

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-medium tracking-tight">Overview</h1>
        <Link href="/invoices/new">
          <Button>Create invoice</Button>
        </Link>
      </div>
      {(error || bootError) && <p className="text-[#C23B3B] mb-6">{error || bootError}</p>}

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <Card>
          <p className="text-sm text-[#6B6B6B]">Total received</p>
          <p className="text-3xl mt-2 tracking-tight">{stats ? `${stats.paidDisplay} VERSE` : "—"}</p>
        </Card>
        <Card>
          <p className="text-sm text-[#6B6B6B]">Outstanding</p>
          <p className="text-3xl mt-2 tracking-tight">{stats ? `${stats.pendingDisplay} VERSE` : "—"}</p>
        </Card>
        <Card>
          <p className="text-sm text-[#6B6B6B]">Paid invoices</p>
          <p className="text-3xl mt-2 tracking-tight">{stats?.paidCount ?? "—"}</p>
        </Card>
        <Card>
          <p className="text-sm text-[#6B6B6B]">Overdue</p>
          <p className="text-3xl mt-2 tracking-tight">{stats?.overdueCount ?? "—"}</p>
        </Card>
      </div>

      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-medium">Recent invoices</h2>
        <p className="text-sm text-[#6B6B6B]">{stats ? `${stats.invoiceCount} invoices` : ""}</p>
      </div>
      {invoices.length === 0 ? (
        <p className="text-[#6B6B6B]">No invoices yet.</p>
      ) : (
        <div className="bg-white border border-[#E6E4DE] rounded-xl divide-y divide-[#E6E4DE]">
          {invoices.map((inv) => (
            <Link
              key={inv.id}
              href={`/invoices/${inv.id}`}
              className="grid grid-cols-[1fr_auto] md:grid-cols-[140px_1fr_auto_auto] gap-3 items-center px-4 py-3 hover:bg-[#F6F5F2]"
            >
              <span className="font-medium">{inv.invoiceNumber}</span>
              <span className="hidden md:block text-[#6B6B6B]">{inv.customerName}</span>
              <StatusPill status={inv.status} />
              <span className="hidden md:block text-sm text-[#8A8A8A]">{formatDate(inv.createdAt)}</span>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
