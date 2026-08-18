"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button, Card, Skeleton } from "@/components/ui";
import { useAccountBootstrap } from "@/components/bootstrap";
import { api, formatError } from "@/lib/client-api";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";
import { verseLabel } from "@/lib/amounts";
import { formatDate } from "@/lib/status";

type Stats = {
  invoiceCount: number;
  paidCount: number;
  overdueCount: number;
  pendingInvoiceCount: number;
  invoicedDisplay: string;
  paidDisplay: string;
  pendingDisplay: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  status: string;
  amountBaseUnits: string;
  createdAt: string;
  payments?: { status: string; txHash: string; verifiedAt?: string | null }[];
};

export default function DashboardPage() {
  if (!isPrivyConfigured()) return <MissingConfig feature="The dashboard" />;
  return <DashboardInner />;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function DashboardInner() {
  const { readyOnServer, error: bootError } = useAccountBootstrap();
  const [stats, setStats] = useState<Stats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!readyOnServer) return;
    setLoading(true);
    Promise.all([
      api<{ stats: Stats }>("/api/dashboard/stats"),
      api<{ invoices: Invoice[] }>("/api/invoices?take=8"),
    ])
      .then(([s, i]) => {
        setStats(s.stats);
        setInvoices(i.invoices);
      })
      .catch((err) => setError(formatError(err)))
      .finally(() => setLoading(false));
  }, [readyOnServer]);

  const rate =
    stats && stats.invoiceCount
      ? `${Math.round((stats.paidCount / stats.invoiceCount) * 100)}% payment rate`
      : "—";
  const verified = invoices.filter((inv) => inv.status === "PAID" || inv.status === "OVERPAID");

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-bold tracking-tight">{greeting()}</h1>
          <p className="text-[#747180] mt-1">Here&apos;s what&apos;s happening with your invoices.</p>
        </div>
        <Link href="/invoices/new">
          <Button className="w-full sm:w-auto">
            <Plus size={16} className="mr-1.5" />
            Create invoice
          </Button>
        </Link>
      </div>
      {(error || bootError) && <p className="text-[#EF4444] mb-6">{error || bootError}</p>}

      {loading && !error && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32 mt-4" />
              <Skeleton className="h-4 w-28 mt-3" />
            </Card>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <Card>
          <p className="text-sm text-[#747180]">Total received</p>
          <p className="text-[28px] font-bold tracking-tight mt-3">
            {stats ? `${stats.paidDisplay} VERSE` : "—"}
          </p>
          <p className="text-sm text-[#747180] mt-2">Verified on-chain</p>
        </Card>
        <Card>
          <p className="text-sm text-[#747180]">Outstanding</p>
          <p className="text-[28px] font-bold tracking-tight mt-3">
            {stats ? `${stats.pendingDisplay} VERSE` : "—"}
          </p>
          <p className="text-sm text-[#747180] mt-2">
            {stats ? `${stats.pendingInvoiceCount} invoices` : "—"}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-[#747180]">Paid invoices</p>
          <p className="text-[28px] font-bold tracking-tight mt-3">{stats?.paidCount ?? "—"}</p>
          <p className="text-sm text-[#747180] mt-2">{rate}</p>
        </Card>
        <Card>
          <p className="text-sm text-[#16A866]">Verified on-chain</p>
          <p className="text-[28px] font-bold tracking-tight mt-3">{stats?.paidCount ?? "—"}</p>
          <p className="text-sm text-[#16A866] mt-2">
            {stats && stats.paidCount > 0 ? "100% verified" : "No payments yet"}
          </p>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card>
          <h2 className="text-lg font-semibold">On-chain activity</h2>
          <p className="text-sm text-[#747180] mt-1 mb-4">Recent verified payments</p>
          {verified.length === 0 ? (
            <p className="text-sm text-[#747180]">Verified payments will appear here.</p>
          ) : (
            <div className="space-y-4">
              {verified.slice(0, 4).map((inv) => (
                <Link key={inv.id} href={`/invoices/${inv.id}`} className="block">
                  <p className="text-sm font-medium text-[#16A866]">✓ Payment verified</p>
                  <p className="font-bold mt-1">{verseLabel(inv.amountBaseUnits)}</p>
                  <p className="text-sm text-[#747180]">{inv.customerName}</p>
                  <p className="text-xs text-[#747180] mt-1">
                    Polygon · {formatDate(inv.payments?.[0]?.verifiedAt ?? inv.createdAt)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
