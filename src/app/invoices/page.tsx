"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button, StatusPill } from "@/components/ui";
import { useAccountBootstrap } from "@/components/bootstrap";
import { api, formatError } from "@/lib/client-api";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";

const FILTERS = ["ALL", "PAID", "PENDING", "PROCESSING", "FAILED", "UNDERPAID", "OVERPAID"] as const;

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
  const [status, setStatus] = useState<(typeof FILTERS)[number]>("ALL");
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
      <div className="flex items-end justify-between gap-6 mb-8">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-[#6C6C74] uppercase mb-6">
            Ledger
          </p>
          <h1 className="font-[family-name:var(--font-syne)] text-4xl tracking-tight">
            Invoices
          </h1>
        </div>
        <Link href="/invoices/new">
          <Button>New invoice</Button>
        </Link>
      </div>
      <div className="flex flex-wrap gap-2 mb-8">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setStatus(f)}
            className={`font-mono text-[10px] tracking-[0.16em] uppercase px-3 py-2 border ${
              status === f ? "border-[#C9A227] text-[#C9A227]" : "border-[#2A2A2F] text-[#6C6C74]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      {error && <p className="text-[#C45C5C] mb-4">{error}</p>}
      {invoices.length === 0 ? (
        <p className="text-[#6C6C74]">No invoices in this view.</p>
      ) : (
        <div className="divide-y divide-[#2A2A2F] border-t border-[#2A2A2F]">
          {invoices.map((inv) => (
            <Link
              key={inv.id}
              href={`/invoices/${inv.id}`}
              className="grid md:grid-cols-4 gap-3 py-4 hover:bg-[#1A1A1E] px-2"
            >
              <span>{inv.invoiceNumber}</span>
              <span className="text-[#A0A0AB]">{inv.customerName}</span>
              <StatusPill status={inv.status} />
              <span className="text-[#6C6C74] text-sm">
                {new Date(inv.createdAt).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
