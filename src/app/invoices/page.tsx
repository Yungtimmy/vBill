"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button, StatusPill } from "@/components/ui";
import { useAccountBootstrap } from "@/components/bootstrap";
import { api, formatError } from "@/lib/client-api";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";
import { formatDate } from "@/lib/status";

const FILTERS = [
  { id: "ALL", label: "All" },
  { id: "DRAFT", label: "Draft" },
  { id: "PENDING", label: "Pending" },
  { id: "PROCESSING", label: "Sent" },
  { id: "PAID", label: "Paid" },
  { id: "EXPIRED", label: "Overdue" },
] as const;

type Invoice = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  status: string;
  createdAt: string;
};

export default function InvoicesPage() {
  if (!isPrivyConfigured()) return <MissingConfig feature="Invoices" />;
  return <InvoicesInner />;
}

function InvoicesInner() {
  const { readyOnServer } = useAccountBootstrap();
  const [status, setStatus] = useState<(typeof FILTERS)[number]["id"]>("ALL");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!readyOnServer) return;
    api<{ invoices: Invoice[] }>(`/api/invoices?status=${status}`)
      .then((d) => setInvoices(d.invoices))
      .catch((err) => setError(formatError(err)));
  }, [readyOnServer, status]);

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-medium tracking-tight">Invoices</h1>
        <Link href="/invoices/new">
          <Button>Create invoice</Button>
        </Link>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setStatus(f.id)}
            className={`text-sm px-3 py-1.5 rounded-full border ${
              status === f.id
                ? "border-[#161616] bg-[#161616] text-[#F6F5F2]"
                : "border-[#E6E4DE] text-[#6B6B6B] bg-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {error && <p className="text-[#C23B3B] mb-4">{error}</p>}
      {invoices.length === 0 ? (
        <p className="text-[#6B6B6B]">No invoices in this view.</p>
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
