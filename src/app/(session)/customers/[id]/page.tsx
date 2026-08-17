"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, StatusPill } from "@/components/ui";
import { useAccountBootstrap } from "@/components/bootstrap";
import { api, formatError } from "@/lib/client-api";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";

type Customer = {
  id: string;
  name: string;
  email?: string | null;
  invoices: { id: string; invoiceNumber: string; status: string }[];
};

export default function CustomerDetailPage() {
  if (!isPrivyConfigured()) return <MissingConfig feature="Customer detail" />;
  return <CustomerDetailInner />;
}

function CustomerDetailInner() {
  const { readyOnServer } = useAccountBootstrap();
  const params = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!readyOnServer) return;
    api<{ customer: Customer }>(`/api/customers/${params.id}`)
      .then((d) => setCustomer(d.customer))
      .catch((err) => setError(formatError(err)));
  }, [readyOnServer, params.id]);

  return (
    <AppShell>
      {error && <p className="text-[#EF4444]">{error}</p>}
      {!customer ? (
        <p className="text-[#747180]">Loading</p>
      ) : (
        <>
          <Link href="/customers" className="text-sm text-[#747180]">
            ← Customers
          </Link>
          <h1 className="text-[28px] font-bold tracking-tight mt-4">{customer.name}</h1>
          <p className="text-[#747180] mb-6">{customer.email ?? "No email"}</p>
          <div className="space-y-3">
            {customer.invoices.map((inv) => (
              <Link key={inv.id} href={`/invoices/${inv.id}`}>
                <Card className="flex justify-between items-center">
                  <span className="font-semibold">{inv.invoiceNumber}</span>
                  <StatusPill status={inv.status} />
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}
