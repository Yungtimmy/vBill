"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button, Card, StatusPill } from "@/components/ui";
import { OnChainProof } from "@/components/on-chain-proof";
import { useAccountBootstrap } from "@/components/bootstrap";
import { api, formatError } from "@/lib/client-api";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";
import { formatDate } from "@/lib/status";
import { verseLabel } from "@/lib/amounts";

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
  createdAt?: string;
  items: { description: string; quantity: string; unitPrice: string }[];
  payments?: {
    status: string;
    txHash: string;
    fromAddress?: string | null;
    toAddress?: string | null;
    verifiedAt?: string | null;
  }[];
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
      const d = await api<{ invoice: Invoice }>(`/api/invoices/${invoice.id}/publish`, { method: "POST" });
      setInvoice(d.invoice);
    } catch (err) {
      setError(formatError(err));
    }
  }

  async function cancel() {
    if (!invoice) return;
    try {
      const d = await api<{ invoice: Invoice }>(`/api/invoices/${invoice.id}/cancel`, { method: "POST" });
      setInvoice(d.invoice);
    } catch (err) {
      setError(formatError(err));
    }
  }

  const paid = invoice?.payments?.find((p) => p.status === "CONFIRMED");
  const verified = invoice?.status === "PAID" || invoice?.status === "OVERPAID";
  const payUrl = invoice ? `${origin}/pay/${invoice.publicId}` : "";
  const explorer = paid ? `https://polygonscan.com/tx/${paid.txHash}` : null;

  return (
    <AppShell>
      {error && <p className="text-[#EF4444] mb-4 no-print">{error}</p>}
      {!invoice ? (
        <p className="text-[#747180]">Loading</p>
      ) : (
        <article className="max-w-2xl space-y-4">
          <Link href="/invoices" className="text-sm text-[#747180] no-print">
            ← Back
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-[28px] font-bold tracking-tight">{invoice.invoiceNumber}</h1>
            <StatusPill status={invoice.status} />
          </div>

          <Card>
            <p className="text-xs font-semibold tracking-wide text-[#747180] uppercase">{invoice.customerName}</p>
            <div className="mt-4 space-y-2 text-sm">
              {invoice.items.map((item, i) => (
                <div key={i} className="flex justify-between gap-4">
                  <span className="break-words">
                    {item.description}
                    {item.quantity !== "1" ? ` × ${item.quantity}` : ""}
                  </span>
                  <span className="font-semibold shrink-0">{item.unitPrice} VERSE</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[32px] font-bold tracking-tight">{verseLabel(invoice.amountBaseUnits)}</p>
            <div className="mt-4 space-y-1 text-sm text-[#747180]">
              <p>Due: {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</p>
              <p>Status: {invoice.status}</p>
            </div>
          </Card>

          <OnChainProof
            verified={Boolean(verified && paid)}
            txHash={paid?.txHash}
            explorerUrl={explorer}
            tokenAddress={invoice.tokenAddress}
            animate={Boolean(verified && paid)}
          />

          <div className="flex flex-wrap gap-3 no-print">
            {invoice.status === "DRAFT" && (
              <Button type="button" onClick={publish}>
                Send invoice
              </Button>
            )}
            {invoice.status !== "DRAFT" && (
              <>
                <Button type="button" variant="ghost" onClick={() => navigator.clipboard.writeText(payUrl)}>
                  Share
                </Button>
                <Button type="button" variant="ghost" onClick={() => window.print()}>
                  Download receipt
                </Button>
              </>
            )}
            {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && invoice.status !== "OVERPAID" && (
              <Button type="button" variant="danger" onClick={cancel}>
                Cancel
              </Button>
            )}
          </div>
        </article>
      )}
    </AppShell>
  );
}
