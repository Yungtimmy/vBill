"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui";
import { useAccountBootstrap } from "@/components/bootstrap";
import { api, formatError } from "@/lib/client-api";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";

type Customer = { id: string; name: string; email?: string | null };

export default function CustomersPage() {
  if (!isPrivyConfigured()) return <MissingConfig feature="Customers" />;
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
      <h1 className="text-[28px] font-bold tracking-tight mb-6">Customers</h1>
      {error && <p className="text-[#EF4444] mb-4">{error}</p>}
      {customers.length === 0 ? (
        <p className="text-[#747180]">Customers appear here after you create invoices.</p>
      ) : (
        <div className="space-y-3">
          {customers.map((c) => (
            <Link key={c.id} href={`/customers/${c.id}`}>
              <Card className="flex justify-between gap-4">
                <span className="font-semibold break-words">{c.name}</span>
                <span className="text-[#747180] text-sm">{c.email ?? "—"}</span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
