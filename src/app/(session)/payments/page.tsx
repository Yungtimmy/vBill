"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card, Skeleton, StatusPill } from "@/components/ui";
import { useAccountBootstrap } from "@/components/bootstrap";
import { api, formatError } from "@/lib/client-api";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";
import { formatDate } from "@/lib/status";
import { verseLabel } from "@/lib/amounts";

type Invoice = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  status: string;
  amountBaseUnits: string;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!readyOnServer) return;
    setLoading(true);
    api<{ invoices: Invoice[] }>("/api/invoices?status=PAID")
      .then((d) => setRows(d.invoices))
      .catch((err) => setError(formatError(err)))
      .finally(() => setLoading(false));
  }, [readyOnServer]);

  return (
    <AppShell>
      <h1 className="text-[28px] font-bold tracking-tight mb-6">Payments</h1>
      {error && <p className="text-[#EF4444] mb-4">{error}</p>}
      {loading && !error ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-36 mt-2" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-[#747180]">No verified payments yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((inv) => (
            <Link key={inv.id} href={`/invoices/${inv.id}`}>
              <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{inv.invoiceNumber}</p>
                  <p className="text-sm text-[#747180] break-words">{inv.customerName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">{verseLabel(inv.amountBaseUnits)}</span>
                  <StatusPill status={inv.status} />
                </div>
                <p className="text-xs text-[#747180] sm:hidden">
                  {formatDate(inv.payments?.[0]?.verifiedAt ?? inv.createdAt)}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
