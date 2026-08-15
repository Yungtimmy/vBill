"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button, StatusPill } from "@/components/ui";
import { useAccountBootstrap } from "@/components/bootstrap";
import { api, formatError } from "@/lib/client-api";
import { shortenAddress } from "@/lib/addresses";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";

type Invoice = {
  id: string;
  publicId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string | null;
  status: string;
  merchantWallet: string;
  chainId: number;
  tokenAddress: string;
  amountBaseUnits: string;
  dueDate?: string | null;
  items: { description: string; quantity: string; unitPrice: string }[];
};

export default function InvoiceDetailPage() {
  if (!isPrivyConfigured()) return <MissingConfig feature="Invoice detail" />;
  return <InvoiceDetailInner />;
}

function InvoiceDetailInner() {
  const { readyOnServer } = useAccountBootstrap();
  const params = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    if (!readyOnServer) return;
    api<{ invoice: Invoice }>(`/api/invoices/${params.id}`)
      .then((d) => setInvoice(d.invoice))
      .catch((err) => setError(formatError(err)));
  }, [readyOnServer, params.id]);

  async function publish() {
    if (!invoice) return;
    try {
      const d = await api<{ invoice: Invoice }>(`/api/invoices/${invoice.id}/publish`, {
        method: "POST",
      });
      setInvoice(d.invoice);
    } catch (err) {
      setError(formatError(err));
    }
  }

  async function cancel() {
    if (!invoice) return;
    try {
      const d = await api<{ invoice: Invoice }>(`/api/invoices/${invoice.id}/cancel`, {
        method: "POST",
      });
      setInvoice(d.invoice);
    } catch (err) {
      setError(formatError(err));
    }
  }

  const payUrl = invoice ? `${origin}/pay/${invoice.publicId}` : "";
  const shareText = invoice
    ? `Invoice ${invoice.invoiceNumber} — ${payUrl}`
    : "";

  return (
    <AppShell>
      {error && <p className="text-[#C45C5C] mb-4">{error}</p>}
      {!invoice ? (
        <p className="text-[#6C6C74]">Loading</p>
      ) : (
        <>
          <p className="font-mono text-xs tracking-[0.2em] text-[#6C6C74] uppercase mb-6">
            {invoice.invoiceNumber}
          </p>
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <h1 className="font-[family-name:var(--font-syne)] text-4xl tracking-tight">
              {invoice.customerName}
            </h1>
            <StatusPill status={invoice.status} />
          </div>
          <dl className="grid md:grid-cols-2 gap-6 text-sm mb-10">
            <div>
              <dt className="text-[#6C6C74]">Destination</dt>
              <dd className="font-mono mt-1">{shortenAddress(invoice.merchantWallet)}</dd>
            </div>
            <div>
              <dt className="text-[#6C6C74]">Chain / token</dt>
              <dd className="mt-1">
                {invoice.chainId} · {shortenAddress(invoice.tokenAddress)}
              </dd>
            </div>
          </dl>
          <ul className="divide-y divide-[#2A2A2F] border-y border-[#2A2A2F] mb-10">
            {invoice.items.map((item, i) => (
              <li key={i} className="py-3 flex justify-between gap-4">
                <span>
                  {item.description} × {item.quantity}
                </span>
                <span className="text-[#A0A0AB]">{item.unitPrice} VERSE</span>
              </li>
            ))}
          </ul>
          {invoice.status !== "DRAFT" && (
            <div className="space-y-4 mb-10">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#6C6C74]">
                Share
              </p>
              <p className="font-mono text-sm break-all">{payUrl}</p>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigator.clipboard.writeText(payUrl)}
                >
                  Copy link
                </Button>
                <a
                  className="text-sm text-[#A0A0AB] underline"
                  href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
                <a
                  className="text-sm text-[#A0A0AB] underline"
                  href={`https://t.me/share/url?url=${encodeURIComponent(payUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Telegram
                </a>
                <a
                  className="text-sm text-[#A0A0AB] underline"
                  href={`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  X
                </a>
                <a
                  className="text-sm text-[#A0A0AB] underline"
                  href={`mailto:${invoice.customerEmail ?? ""}?subject=${encodeURIComponent(
                    invoice.invoiceNumber,
                  )}&body=${encodeURIComponent(payUrl)}`}
                >
                  Email
                </a>
                <Link className="text-sm text-[#A0A0AB] underline" href={`/pay/${invoice.publicId}`}>
                  Payment page
                </Link>
                <Link
                  className="text-sm text-[#A0A0AB] underline"
                  href={`/verify/${invoice.publicId}`}
                >
                  Proof
                </Link>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            {invoice.status === "DRAFT" && (
              <Button type="button" onClick={publish}>
                Publish
              </Button>
            )}
            {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
              <Button type="button" variant="danger" onClick={cancel}>
                Cancel
              </Button>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
