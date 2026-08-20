"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatUnits } from "viem";
import { AppShell } from "@/components/app-shell";
import { Button, Card, Input, Label } from "@/components/ui";
import { useAccountBootstrap } from "@/components/bootstrap";
import { api, formatError } from "@/lib/client-api";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";
import { parseQuantity, parseVerseAmount } from "@/lib/amounts";
import {
  formatUsdFromScaled,
  meetsMinimumUsd,
  parsePriceUsd,
  parseUsdAmount,
  usdValueScaled,
  verseBaseForUsd,
} from "@/lib/verse-min";

type Line = { description: string; quantity: string; unitPrice: string };

type VerseQuote = {
  symbol: string;
  priceUsd: string;
  minimumUsd: string;
  minimumVerse: string;
  updatedAt: string;
  source: string;
};

export default function NewInvoicePage() {
  if (!isPrivyConfigured()) return <MissingConfig feature="Invoice creation" />;
  return <NewInvoiceInner />;
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
  const [items, setItems] = useState<Line[]>([{ description: "", quantity: "1", unitPrice: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [quote, setQuote] = useState<VerseQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  useEffect(() => {
    if (!readyOnServer) return;
    let cancelled = false;
    async function loadQuote() {
      try {
        const data = await api<VerseQuote>("/api/pricing/verse");
        if (!cancelled) {
          setQuote(data);
          setQuoteError(null);
        }
      } catch {
        if (!cancelled) {
          setQuote(null);
          setQuoteError("VERSE price temporarily unavailable.");
        }
      }
    }
    loadQuote();
    const t = window.setInterval(loadQuote, 45_000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [readyOnServer]);

  const totalBase = useMemo(() => {
    try {
      return items.reduce((sum, item) => {
        if (!item.quantity.trim() || !item.unitPrice.trim()) return sum;
        return sum + parseVerseAmount(item.unitPrice, 18) * parseQuantity(item.quantity);
      }, 0n);
    } catch {
      return 0n;
    }
  }, [items]);

  const priced = useMemo(() => {
    if (!quote || totalBase <= 0n) return null;
    try {
      const priceScaled = parsePriceUsd(quote.priceUsd);
      const minUsd = parseUsdAmount(quote.minimumUsd);
      const usdScaled = usdValueScaled(totalBase, priceScaled, 18);
      return {
        usdLabel: formatUsdFromScaled(usdScaled),
        ok: meetsMinimumUsd(totalBase, priceScaled, minUsd, 18),
      };
    } catch {
      return null;
    }
  }, [quote, totalBase]);

  function applyUsd(usd: string) {
    if (!quote) return;
    try {
      const base = verseBaseForUsd(parseUsdAmount(usd), parsePriceUsd(quote.priceUsd), 18);
      const human = formatUnits(base, 18);
      const next = [...items];
      const first = next[0] ?? { description: "", quantity: "1", unitPrice: "" };
      next[0] = { ...first, quantity: first.quantity.trim() || "1", unitPrice: human };
      setItems(next);
    } catch {
      setError("Could not apply that amount with the current price.");
    }
  }

  async function onSubmit(e: FormEvent, publish: boolean) {
    e.preventDefault();
    if (!readyOnServer) return;
    if (!quote) {
      setError("VERSE price temporarily unavailable.");
      return;
    }
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

  const canSubmit = Boolean(quote) && !quoteError && !busy;
  const belowMin = Boolean(quote && priced && !priced.ok && totalBase > 0n);

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
              <Label>Payment token</Label>
              <div className="w-full bg-bg border border-line text-ink px-4 py-3.5 rounded-2xl font-semibold">
                VERSE
              </div>
            </div>
            <div>
              <Label>Invoice items</Label>
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={i} className="rounded-2xl border border-line p-3">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                      <Input
                        placeholder="Item"
                        value={item.description}
                        onChange={(e) => {
                          const next = [...items];
                          next[i] = { ...item, description: e.target.value };
                          setItems(next);
                        }}
                      />
                      <Input
                        placeholder="No. of items"
                        className="w-24"
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
                          className="w-32 pr-14"
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
                  onClick={() => setItems([...items, { description: "", quantity: "1", unitPrice: "" }])}
                >
                  + Add item
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted mb-2">Quick amount</p>
              <div className="flex gap-2">
                {["1", "10", "100"].map((usd) => (
                  <Button
                    key={usd}
                    type="button"
                    variant="ghost"
                    disabled={!quote}
                    onClick={() => applyUsd(usd)}
                  >
                    ${usd}
                  </Button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">USD equivalent of VERSE at the current server price.</p>
            </div>
            <div className="rounded-2xl bg-bg border border-line p-4 text-sm">
              <p className="font-semibold">Minimum invoice value</p>
              {quote && (
                <p className="text-muted mt-1">Minimum VERSE: ~{quote.minimumVerse} VERSE</p>
              )}
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
            {belowMin && quote && (
              <p className="text-error text-sm">
                Minimum invoice amount is $1 USD equivalent of VERSE. Current price: ${quote.priceUsd} / VERSE.
                Minimum: ~{quote.minimumVerse} VERSE.
              </p>
            )}
            {error && <p className="text-error">{error}</p>}
          </form>
        </Card>
      </div>

      <div className="sticky bottom-0 z-20 border-t border-line bg-card">
        <div className="max-w-xl mx-auto px-4 sm:px-0 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted">Total</p>
              <p className="text-xl font-bold truncate">
                {totalBase > 0n ? `${formatUnits(totalBase, 18)} VERSE` : "—"}
              </p>
              {priced && <p className="text-xs text-muted">≈ ${priced.usdLabel} USD</p>}
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Button type="button" variant="ghost" disabled={busy} onClick={() => router.push("/invoices")}>
                Cancel
              </Button>
              <Button type="button" variant="ghost" disabled={!canSubmit} onClick={(e) => onSubmit(e, false)}>
                Save draft
              </Button>
              <Button type="button" disabled={!canSubmit} onClick={(e) => onSubmit(e, true)}>
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
            <Button type="button" variant="ghost" className="flex-1" disabled={!canSubmit} onClick={(e) => onSubmit(e, false)}>
              Save draft
            </Button>
            <Button type="button" className="flex-1" disabled={!canSubmit} onClick={(e) => onSubmit(e, true)}>
              Create invoice
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
