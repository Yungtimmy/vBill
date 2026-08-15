"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/ui";
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
      {error && <p className="text-[#C45C5C]">{error}</p>}
      {!customer ? (
        <p className="text-[#6C6C74]">Loading</p>
      ) : (
        <>
          <p className="font-mono text-xs tracking-[0.2em] text-[#6C6C74] uppercase mb-6">
            Customer
          </p>
          <h1 className="font-[family-name:var(--font-syne)] text-4xl tracking-tight mb-2">
            {customer.name}
          </h1>
          <p className="text-[#A0A0AB] mb-10">{customer.email ?? "No email"}</p>
          <div className="divide-y divide-[#2A2A2F] border-t border-[#2A2A2F]">
            {customer.invoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex justify-between py-4"
              >
                <span>{inv.invoiceNumber}</span>
                <StatusPill status={inv.status} />
              </Link>
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}
