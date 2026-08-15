"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useAccountBootstrap } from "@/components/bootstrap";
import { api, formatError } from "@/lib/client-api";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";

type Customer = { id: string; name: string; email?: string | null };

export default function CustomersPage() {
  if (!isPrivyConfigured()) return <MissingConfig feature="Clients" />;
  return <CustomersInner />;
}

function CustomersInner() {
  const { readyOnServer } = useAccountBootstrap();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!readyOnServer) return;
    api<{ customers: Customer[] }>("/api/customers")
      .then((d) => setCustomers(d.customers))
      .catch((err) => setError(formatError(err)));
  }, [readyOnServer]);

  return (
    <AppShell>
      <h1 className="text-2xl font-medium tracking-tight mb-6">Clients</h1>
      {error && <p className="text-[#C23B3B] mb-4">{error}</p>}
      {customers.length === 0 ? (
        <p className="text-[#6B6B6B]">Clients appear here after you create invoices.</p>
      ) : (
        <div className="bg-white border border-[#E6E4DE] rounded-xl divide-y divide-[#E6E4DE]">
          {customers.map((c) => (
            <Link
              key={c.id}
              href={`/customers/${c.id}`}
              className="flex justify-between px-4 py-3 hover:bg-[#F6F5F2]"
            >
              <span className="font-medium">{c.name}</span>
              <span className="text-[#6B6B6B]">{c.email ?? "—"}</span>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
