"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button, Card, Skeleton, Spinner, StatusPill } from "@/components/ui";
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
  const [copied, setCopied] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, []);

  async function share() {
    if (!invoice) return;
    try {
      await navigator.clipboard.writeText(payUrl);
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy automatically - copy this link: " + payUrl);
    }
  }

  useEffect(() => {
    if (!readyOnServer) return;
    api<{ invoice: Invoice }>(`/api/invoices/${params.id}`)
      .then((d) => setInvoice(d.invoice))
      .catch((err) => setError(formatError(err)));
  }, [readyOnServer, params.id]);

  async function publish() {
    if (!invoice) return;
    setPublishing(true);
    try {
      const d = await api<{ invoice: Invoice }>(`/api/invoices/${invoice.id}/publish`, { method: "POST" });
      setInvoice(d.invoice);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setPublishing(false);
    }
  }

  async function cancel() {
    if (!invoice) return;
    setCancelling(true);
    try {
      const d = await api<{ invoice: Invoice }>(`/api/invoices/${invoice.id}/cancel`, { method: "POST" });
      setInvoice(d.invoice);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setCancelling(false);
      setConfirmCancel(false);
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
        <div className="max-w-2xl space-y-4">
          <Skeleton className="h-4 w-16" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
          <Card>
            <Skeleton className="h-4 w-40" />
            <div className="mt-5 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-8 w-44 mt-5" />
            <Skeleton className="h-4 w-24 mt-4" />
          </Card>
          <Card>
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-64 mt-3" />
          </Card>
        </div>
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
              <Button type="button" onClick={publish} disabled={publishing}>
                {publishing ? (
                  <>
                    <Spinner className="mr-2" /> Sending…
                  </>
                ) : (
                  "Send invoice"
                )}
              </Button>
            )}
            {invoice.status !== "DRAFT" && (
              <>
                <Button type="button" variant="ghost" onClick={share}>
                  {copied ? "✓ Copied!" : "Share"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => window.print()}>
                  Download receipt
                </Button>
              </>
            )}
            {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && invoice.status !== "OVERPAID" && (
              <Button type="button" variant="danger" onClick={() => setConfirmCancel(true)}>
                Cancel
              </Button>
            )}
          </div>

          {confirmCancel && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#17151F]/40 p-4 no-print"
              onClick={() => {
                if (!cancelling) setConfirmCancel(false);
              }}
            >
              <div
                className="w-full max-w-md bg-white rounded-[22px] p-6 shadow-[0_24px_64px_-16px_rgba(23,21,31,0.35)]"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-bold text-[#17151F]">Cancel this invoice?</h2>
                <p className="mt-2 text-sm text-[#747180]">
                  Are you sure you want to cancel this invoice? The payment link will stop working and this can&apos;t be
                  undone.
                </p>
                <div className="mt-6 flex gap-3">
                  <Button type="button" variant="danger" disabled={cancelling} onClick={cancel}>
                    {cancelling ? (
                      <>
                        <Spinner className="mr-2" /> Cancelling…
                      </>
                    ) : (
                      "Cancel"
                    )}
                  </Button>
                  <Button type="button" variant="ghost" disabled={cancelling} onClick={() => setConfirmCancel(false)}>
                    Keep
                  </Button>
                </div>
              </div>
            </div>
          )}
        </article>
      )}
    </AppShell>
  );
}
