"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button, StatusPill } from "@/components/ui";
import { OnChainProof } from "@/components/on-chain-proof";
import { useAccountBootstrap } from "@/components/bootstrap";
import { api, formatError } from "@/lib/client-api";
import { shortenAddress, shortenHash } from "@/lib/addresses";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";
import { formatDate } from "@/lib/status";
import { formatVerseAmount, parseBaseUnits } from "@/lib/amounts";

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

function amount(base?: string) {
  if (!base) return "—";
  try {
    return formatVerseAmount(parseBaseUnits(base), 18);
  } catch {
    return "—";
  }
}

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

  const paid = invoice?.payments?.find((p) => p.status === "CONFIRMED");
  const verified = invoice?.status === "PAID" || invoice?.status === "OVERPAID";
  const payUrl = invoice ? `${origin}/pay/${invoice.publicId}` : "";
  const explorer = paid ? `https://polygonscan.com/tx/${paid.txHash}` : null;

  return (
    <AppShell>
      {error && <p className="text-[#C23B3B] mb-4 no-print">{error}</p>}
      {!invoice ? (
        <p className="text-[#6B6B6B]">Loading</p>
      ) : (
        <article className="max-w-2xl">
          <Link href="/invoices" className="text-sm text-[#6B6B6B] no-print">
            ← Back to invoices
          </Link>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-medium tracking-tight">{invoice.invoiceNumber}</h1>
            <StatusPill status={invoice.status} />
          </div>
          <p className="mt-6 text-xl">{invoice.customerName}</p>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Created {formatDate(invoice.createdAt)}
            {invoice.dueDate ? ` · Due ${formatDate(invoice.dueDate)}` : ""}
          </p>

          <hr className="my-8 border-[#E6E4DE]" />

          <div className="text-sm">
            <div className="flex justify-between text-[#6B6B6B] mb-3">
              <span>Description</span>
              <span>Amount</span>
            </div>
            {invoice.items.map((item, i) => (
              <div key={i} className="flex justify-between py-2">
                <span>
                  {item.description}
                  {item.quantity !== "1" ? ` × ${item.quantity}` : ""}
                </span>
                <span>{item.unitPrice} VERSE</span>
              </div>
            ))}
            <div className="flex justify-between pt-4 mt-2 border-t border-[#E6E4DE] font-medium">
              <span>Total</span>
              <span>{amount(invoice.amountBaseUnits)} VERSE</span>
            </div>
          </div>

          <hr className="my-8 border-[#E6E4DE]" />

          <h2 className="text-sm font-medium text-[#6B6B6B] mb-4">Payment</h2>
          <dl className="space-y-3 text-sm">
            <Row label="Status" value={verified ? "Verified" : invoice.status} />
            {paid?.verifiedAt && <Row label="Paid" value={formatDate(paid.verifiedAt)} />}
            <Row label="Network" value="Polygon" />
            <Row label="Token" value="VERSE" />
            <Row label="Recipient" value={shortenAddress(invoice.merchantWallet)} />
            {paid && <Row label="Transaction" value={shortenHash(paid.txHash)} />}
          </dl>
          {explorer && (
            <a href={explorer} target="_blank" rel="noreferrer" className="inline-block mt-4 text-sm text-[#0C7A4D] underline">
              View on PolygonScan
            </a>
          )}

          <div className="mt-8">
            <OnChainProof verified={Boolean(verified && paid)} txHash={paid?.txHash} explorerUrl={explorer} />
          </div>

          <div className="flex flex-wrap gap-3 mt-8 no-print">
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6">
      <dt className="text-[#6B6B6B]">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
