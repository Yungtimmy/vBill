"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button, Input, Label } from "@/components/ui";
import { useAccountBootstrap } from "@/components/bootstrap";
import { api, formatError } from "@/lib/client-api";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";

type Line = { description: string; quantity: string; unitPrice: string };

export default function NewInvoicePage() {
  if (!isPrivyConfigured()) return <MissingConfig feature="Invoice creation" />;
  return <NewInvoiceInner />;
}

function NewInvoiceInner() {
  const { readyOnServer } = useAccountBootstrap();
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Line[]>([
    { description: "", quantity: "1", unitPrice: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent, publish: boolean) {
    e.preventDefault();
    if (!readyOnServer) return;
    setBusy(true);
    setError(null);
    try {
      const data = await api<{ invoice: { id: string } }>("/api/invoices", {
        method: "POST",
        body: JSON.stringify({
          customerName,
          customerEmail: customerEmail || undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          notes: notes || undefined,
          items,
          publish,
        }),
      });
      router.push(`/invoices/${data.invoice.id}`);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-medium tracking-tight mb-8">Create invoice</h1>
      <form className="max-w-2xl space-y-6">
        <div>
          <Label>Customer</Label>
          <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
        </div>
        <div>
          <Label>Customer email</Label>
          <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
        </div>
        <div>
          <Label>Due date</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div className="space-y-3">
          <Label>Items</Label>
          {items.map((item, i) => (
            <div key={i} className="grid md:grid-cols-3 gap-3">
              <Input
                placeholder="Description"
                value={item.description}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...item, description: e.target.value };
                  setItems(next);
                }}
              />
              <Input
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...item, quantity: e.target.value };
                  setItems(next);
                }}
              />
              <Input
                placeholder="Amount (VERSE)"
                value={item.unitPrice}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...item, unitPrice: e.target.value };
                  setItems(next);
                }}
              />
            </div>
          ))}
          <button
            type="button"
            className="text-sm text-[#0C7A4D]"
            onClick={() => setItems([...items, { description: "", quantity: "1", unitPrice: "" }])}
          >
            Add line
          </button>
        </div>
        <div>
          <Label>Notes</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {error && <p className="text-[#C23B3B]">{error}</p>}
        <div className="flex gap-3">
          <Button type="button" disabled={busy} onClick={(e) => onSubmit(e, true)}>
            Create invoice
          </Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={(e) => onSubmit(e, false)}>
            Save draft
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
