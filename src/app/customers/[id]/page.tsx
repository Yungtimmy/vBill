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
  if (!isPrivyConfigured()) return <MissingConfig feature="Client detail" />;
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
      {error && <p className="text-[#C23B3B]">{error}</p>}
      {!customer ? (
        <p className="text-[#6B6B6B]">Loading</p>
      ) : (
        <>
          <Link href="/customers" className="text-sm text-[#6B6B6B]">
            ← Back to clients
          </Link>
          <h1 className="text-2xl font-medium tracking-tight mt-6">{customer.name}</h1>
          <p className="text-[#6B6B6B] mb-8">{customer.email ?? "No email"}</p>
          <div className="bg-white border border-[#E6E4DE] rounded-xl divide-y divide-[#E6E4DE]">
            {customer.invoices.map((inv) => (
              <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex justify-between px-4 py-3 hover:bg-[#F6F5F2]">
                <span className="font-medium">{inv.invoiceNumber}</span>
                <StatusPill status={inv.status} />
              </Link>
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}
