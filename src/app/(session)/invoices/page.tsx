"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button, Card, Input, Skeleton, StatusPill } from "@/components/ui";
import { useAccountBootstrap } from "@/components/bootstrap";
import { api, formatError } from "@/lib/client-api";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";
import { formatDate } from "@/lib/status";
import { verseLabel } from "@/lib/amounts";

const FILTERS = [
  { id: "ALL", label: "All" },
  { id: "DRAFT", label: "Draft" },
  { id: "PENDING", label: "Pending" },
  { id: "PAID", label: "Paid" },
  { id: "EXPIRED", label: "Overdue" },
] as const;

type Invoice = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  status: string;
  createdAt: string;
  amountBaseUnits: string;
};

export default function InvoicesPage() {
  if (!isPrivyConfigured()) return <MissingConfig feature="Invoices" />;
  return <InvoicesInner />;
}

function InvoicesInner() {
  const { readyOnServer } = useAccountBootstrap();
  const [status, setStatus] = useState<(typeof FILTERS)[number]["id"]>("ALL");
  const [query, setQuery] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!readyOnServer) return;
    setLoading(true);
    api<{ invoices: Invoice[] }>(`/api/invoices?status=${status}`)
      .then((d) => setInvoices(d.invoices))
      .catch((err) => setError(formatError(err)))
      .finally(() => setLoading(false));
  }, [readyOnServer, status]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q),
    );
  }, [invoices, query]);

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-[28px] font-bold tracking-tight">Invoices</h1>
        <Link href="/invoices/new">
          <Button className="w-full sm:w-auto">
            <Plus size={16} className="mr-1.5" />
            Create invoice
          </Button>
        </Link>
      </div>
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
        <div className="flex flex-wrap gap-2 flex-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatus(f.id)}
              className={`text-sm px-3 py-1.5 rounded-full ${
                status === f.id
                  ? "bg-purple text-white font-semibold"
                  : "bg-card border border-line text-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="md:w-64">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" aria-label="Search invoices" />
        </div>
      </div>
      {error && <p className="text-error mb-4">{error}</p>}
      {loading && !error ? (
        <>
          <Card className="hidden md:block p-0 overflow-hidden">
            <div className="divide-y divide-line">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="grid grid-cols-[140px_1fr_160px_140px_auto] gap-3 items-center px-5 py-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              ))}
            </div>
          </Card>
          <div className="md:hidden space-y-3">
            {[0, 1, 2].map((i) => (
              <Card key={i}>
                <div className="flex items-start justify-between gap-3">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-36 mt-3" />
                <Skeleton className="h-6 w-24 mt-3" />
              </Card>
            ))}
          </div>
        </>
      ) : visible.length === 0 ? (
        <p className="text-muted">No invoices in this view.</p>
      ) : (
        <>
          <Card className="hidden md:block p-0 overflow-hidden">
            <div className="grid grid-cols-[140px_1fr_160px_140px_auto] gap-3 px-5 py-3 text-xs font-semibold text-muted">
              <span>Invoice</span>
              <span>Customer</span>
              <span>Amount</span>
              <span>Date</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-line">
              {visible.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="grid grid-cols-[140px_1fr_160px_140px_auto] gap-3 items-center px-5 py-3.5 hover:bg-lavender"
                >
                  <span className="font-semibold">{inv.invoiceNumber}</span>
                  <span className="text-muted truncate">{inv.customerName}</span>
                  <span className="font-semibold">{verseLabel(inv.amountBaseUnits)}</span>
                  <span className="text-sm text-muted">{formatDate(inv.createdAt)}</span>
                  <StatusPill status={inv.status} />
                </Link>
              ))}
            </div>
          </Card>
          <div className="md:hidden space-y-3">
            {visible.map((inv) => (
              <Link key={inv.id} href={`/invoices/${inv.id}`}>
                <Card>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{inv.invoiceNumber}</p>
                      <p className="text-sm text-muted mt-1 break-words">{inv.customerName}</p>
                    </div>
                    <StatusPill status={inv.status} />
                  </div>
                  <p className="font-bold mt-3">{verseLabel(inv.amountBaseUnits)}</p>
                  <p className="text-xs text-muted mt-1">{formatDate(inv.createdAt)}</p>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}
