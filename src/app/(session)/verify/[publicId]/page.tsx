"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Skeleton } from "@/components/ui";
import { OnChainProof } from "@/components/on-chain-proof";
import { PayCard, PublicFrame } from "@/components/public-frame";
import { shortenHash } from "@/lib/addresses";

type Proof = {
  invoiceNumber: string;
  publicId: string;
  status: string;
  verifiedOnChain: boolean;
  amountDisplay: string;
  tokenSymbol: string;
  tokenAddress?: string;
  businessName: string;
  payments: {
    txHash: string;
    explorerUrl: string;
    verifiedAt: string | null;
  }[];
};

export default function VerifyPage() {
  const params = useParams<{ publicId: string }>();
  const [proof, setProof] = useState<Proof | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/verify/${params.publicId}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Not found.");
        setProof(json.proof);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load."));
  }, [params.publicId]);

  if (error) {
    return (
      <PublicFrame>
        <p className="max-w-md mx-auto text-error">{error}</p>
      </PublicFrame>
    );
  }
  if (!proof) {
    return (
      <PublicFrame>
        <PayCard className="max-w-md mx-auto text-center">
          <Skeleton className="h-16 w-16 rounded-full mx-auto" />
          <Skeleton className="h-10 w-56 mx-auto mt-8" />
          <Skeleton className="h-4 w-32 mx-auto mt-4" />
          <Skeleton className="h-4 w-24 mx-auto mt-2" />
          <Skeleton className="h-12 w-full mt-8 rounded-2xl" />
        </PayCard>
      </PublicFrame>
    );
  }

  const payment = proof.payments[0];

  return (
    <PublicFrame>
      <PayCard className="max-w-md mx-auto text-center">
        {proof.verifiedOnChain ? (
          <>
            <div className="mx-auto h-16 w-16 rounded-full bg-success-soft text-success text-3xl font-bold flex items-center justify-center">
              ✓
            </div>
            <p className="mt-6 text-xl font-semibold">Payment verified</p>
          </>
        ) : (
          <p className="text-sm font-medium text-muted">Payment receipt</p>
        )}
        <p className="mt-4 text-[32px] font-bold tracking-tight">
          {proof.amountDisplay} {proof.tokenSymbol}
        </p>
        <p className="mt-2 font-medium">{proof.businessName}</p>
        <p className="mt-1 text-sm text-muted">{proof.invoiceNumber}</p>
        {payment && <p className="mt-4 font-mono text-sm text-muted">{shortenHash(payment.txHash)}</p>}
        <div className="mt-6 text-left">
          <OnChainProof
            verified={proof.verifiedOnChain}
            txHash={payment?.txHash}
            explorerUrl={payment?.explorerUrl}
            tokenAddress={proof.tokenAddress}
          />
        </div>
        {payment && (
          <a href={payment.explorerUrl} target="_blank" rel="noreferrer" className="inline-block mt-6 w-full">
            <Button className="w-full">View transaction</Button>
          </a>
        )}
        <div className="mt-3 no-print">
          <Button variant="ghost" className="w-full" onClick={() => window.print()}>
            Download receipt
          </Button>
        </div>
      </PayCard>
    </PublicFrame>
  );
}
