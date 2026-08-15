"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button, Input, Label } from "@/components/ui";
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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    api<{ customers: Customer[] }>("/api/customers")
      .then((d) => setCustomers(d.customers))
      .catch((err) => setError(formatError(err)));
  }

  useEffect(() => {
    if (readyOnServer) load();
  }, [readyOnServer]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api("/api/customers", {
        method: "POST",
        body: JSON.stringify({ name, email: email || undefined }),
      });
      setName("");
      setEmail("");
      load();
    } catch (err) {
      setError(formatError(err));
    }
  }

  return (
    <AppShell>
      <p className="font-mono text-xs tracking-[0.2em] text-[#6C6C74] uppercase mb-6">
        Directory
      </p>
      <h1 className="font-[family-name:var(--font-syne)] text-4xl tracking-tight mb-8">
        Customers
      </h1>
      <form onSubmit={onSubmit} className="grid md:grid-cols-3 gap-3 max-w-3xl mb-12">
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button type="submit">Add</Button>
        </div>
      </form>
      {error && <p className="text-[#C45C5C] mb-4">{error}</p>}
      {customers.length === 0 ? (
        <p className="text-[#6C6C74]">No customers yet.</p>
      ) : (
        <div className="divide-y divide-[#2A2A2F] border-t border-[#2A2A2F]">
          {customers.map((c) => (
            <Link
              key={c.id}
              href={`/customers/${c.id}`}
              className="flex justify-between py-4 px-2 hover:bg-[#1A1A1E]"
            >
              <span>{c.name}</span>
              <span className="text-[#6C6C74]">{c.email ?? "—"}</span>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
