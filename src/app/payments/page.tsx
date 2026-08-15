"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/ui";
import { useAccountBootstrap } from "@/components/bootstrap";
import { api, formatError } from "@/lib/client-api";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";
import { formatDate } from "@/lib/status";

type Invoice = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  status: string;
  updatedAt?: string;
  createdAt: string;
  payments?: { status: string; verifiedAt?: string | null }[];
};

export default function PaymentsPage() {
  if (!isPrivyConfigured()) return <MissingConfig feature="Payments" />;
  return <PaymentsInner />;
}

function PaymentsInner() {
  const { readyOnServer } = useAccountBootstrap();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!readyOnServer) return;
    api<{ invoices: Invoice[] }>("/api/invoices?status=PAID")
      .then((d) => setRows(d.invoices))
      .catch((err) => setError(formatError(err)));
  }, [readyOnServer]);

  return (
    <AppShell>
      <h1 className="text-2xl font-medium tracking-tight mb-6">Payments</h1>
      {error && <p className="text-[#C23B3B] mb-4">{error}</p>}
      {rows.length === 0 ? (
        <p className="text-[#6B6B6B]">No verified payments yet.</p>
      ) : (
        <div className="bg-white border border-[#E6E4DE] rounded-xl divide-y divide-[#E6E4DE]">
          {rows.map((inv) => (
            <Link
              key={inv.id}
              href={`/invoices/${inv.id}`}
              className="grid grid-cols-[1fr_auto] md:grid-cols-[140px_1fr_auto_auto] gap-3 items-center px-4 py-3 hover:bg-[#F6F5F2]"
            >
              <span className="font-medium">{inv.invoiceNumber}</span>
              <span className="hidden md:block text-[#6B6B6B]">{inv.customerName}</span>
              <StatusPill status={inv.status} />
              <span className="hidden md:block text-sm text-[#8A8A8A]">
                {formatDate(inv.payments?.[0]?.verifiedAt ?? inv.createdAt)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
