"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button, Card, Input, Label } from "@/components/ui";
import { useAccountBootstrap } from "@/components/bootstrap";
import { api, formatError } from "@/lib/client-api";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";

type Line = { description: string; quantity: string; unitPrice: string };

export default function NewInvoicePage() {
  if (!isPrivyConfigured()) return <MissingConfig feature="Invoice creation" />;
  return <NewInvoiceInner />;
}

function lineAmount(item: Line): number {
  const q = Number(item.quantity);
  const p = Number(item.unitPrice);
  if (!Number.isFinite(q) || !Number.isFinite(p)) return 0;
  return q * p;
}

function combineDue(dueDate: string, dueTime: string): string | undefined {
  if (!dueDate) return undefined;
  const time = dueTime || "23:59";
  const d = new Date(`${dueDate}T${time}`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function NewInvoiceInner() {
  const { readyOnServer } = useAccountBootstrap();
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Line[]>([{ description: "", quantity: "", unitPrice: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const total = useMemo(() => items.reduce((sum, item) => sum + lineAmount(item), 0), [items]);

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
          dueDate: combineDue(dueDate, dueTime),
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
      <div className="max-w-xl mx-auto pb-28">
        <h1 className="text-[28px] font-bold tracking-tight mb-6">Create invoice</h1>
        <Card className="p-6 sm:p-8">
          <form className="space-y-6">
            <div>
              <Label>Customer</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" required />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="customer@email.com" />
            </div>
            <div>
              <Label>Invoice items</Label>
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={i} className="rounded-2xl border border-line p-3 space-y-2">
                    <Input
                      placeholder="Item"
                      value={item.description}
                      onChange={(e) => {
                        const next = [...items];
                        next[i] = { ...item, description: e.target.value };
                        setItems(next);
                      }}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="No. of items"
                        value={item.quantity}
                        onChange={(e) => {
                          const next = [...items];
                          next[i] = { ...item, quantity: e.target.value };
                          setItems(next);
                        }}
                      />
                      <div className="relative">
                        <Input
                          placeholder="0.00"
                          className="pr-14"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const next = [...items];
                            next[i] = { ...item, unitPrice: e.target.value };
                            setItems(next);
                          }}
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted pointer-events-none select-none">
                          VERSE
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-sm font-medium text-purple"
                  onClick={() => setItems([...items, { description: "", quantity: "", unitPrice: "" }])}
                >
                  + Add item
                </button>
              </div>
            </div>
            <div>
              <Label>Due date &amp; time</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                <Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
            </div>
            {error && <p className="text-error">{error}</p>}
          </form>
        </Card>
      </div>

      <div className="sticky bottom-0 z-20 border-t border-line bg-card">
        <div className="max-w-xl mx-auto px-4 sm:px-0 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted">Total</p>
              <p className="text-xl font-bold truncate">{total > 0 ? `${Number(total.toFixed(8))} VERSE` : "—"}</p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Button type="button" variant="ghost" disabled={busy} onClick={() => router.push("/invoices")}>
                Cancel
              </Button>
              <Button type="button" variant="ghost" disabled={busy} onClick={(e) => onSubmit(e, false)}>
                Save draft
              </Button>
              <Button type="button" disabled={busy} onClick={(e) => onSubmit(e, true)}>
                Create invoice
              </Button>
            </div>
            <button
              type="button"
              className="sm:hidden text-sm text-muted"
              onClick={() => router.push("/invoices")}
            >
              Cancel
            </button>
          </div>
          <div className="flex sm:hidden gap-2 mt-3">
            <Button type="button" variant="ghost" className="flex-1" disabled={busy} onClick={(e) => onSubmit(e, false)}>
              Save draft
            </Button>
            <Button type="button" className="flex-1" disabled={busy} onClick={(e) => onSubmit(e, true)}>
              Create invoice
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
