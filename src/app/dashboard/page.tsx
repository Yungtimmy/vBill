"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button, Card, StatusPill } from "@/components/ui";
import { useAccountBootstrap } from "@/components/bootstrap";
import { api, formatError } from "@/lib/client-api";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";

type Stats = {
  invoiceCount: number;
  invoicedDisplay: string;
  paidDisplay: string;
  pendingDisplay: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amountBaseUnits: string;
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
      <p className="font-mono text-xs tracking-[0.2em] text-[#6C6C74] uppercase mb-6">
        Overview
      </p>
      <div className="flex items-end justify-between gap-6 mb-10">
        <h1 className="font-[family-name:var(--font-syne)] text-4xl tracking-tight">
          Dashboard
        </h1>
        <Link href="/invoices/new">
          <Button>New invoice</Button>
        </Link>
      </div>
      {(error || bootError) && (
        <p className="text-[#C45C5C] mb-6">{error || bootError}</p>
      )}
      <div className="grid md:grid-cols-2 gap-4 mb-12">
        <Card>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#6C6C74]">
            Total invoiced
          </p>
          <p className="text-3xl mt-3 font-[family-name:var(--font-syne)]">
            {stats ? `${stats.invoicedDisplay} VERSE` : "—"}
          </p>
        </Card>
        <Card>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#6C6C74]">
            Total paid
          </p>
          <p className="text-3xl mt-3 font-[family-name:var(--font-syne)] text-[#6F8F72]">
            {stats ? `${stats.paidDisplay} VERSE` : "—"}
          </p>
        </Card>
        <Card>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#6C6C74]">
            Pending
          </p>
          <p className="text-3xl mt-3 font-[family-name:var(--font-syne)]">
            {stats ? `${stats.pendingDisplay} VERSE` : "—"}
          </p>
        </Card>
        <Card>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#6C6C74]">
            Invoices
          </p>
          <p className="text-3xl mt-3 font-[family-name:var(--font-syne)]">
            {stats?.invoiceCount ?? "—"}
          </p>
        </Card>
      </div>
      <h2 className="font-[family-name:var(--font-syne)] text-2xl mb-6">Recent invoices</h2>
      {invoices.length === 0 ? (
        <p className="text-[#6C6C74]">No invoices yet.</p>
      ) : (
        <div className="divide-y divide-[#2A2A2F] border-t border-[#2A2A2F]">
          {invoices.map((inv) => (
            <Link
              key={inv.id}
              href={`/invoices/${inv.id}`}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 py-4 hover:bg-[#1A1A1E] px-2"
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
