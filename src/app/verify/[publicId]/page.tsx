"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui";
import { OnChainProof } from "@/components/on-chain-proof";
import { PublicFrame } from "@/components/public-frame";
import { shortenHash } from "@/lib/addresses";

type Proof = {
  invoiceNumber: string;
  publicId: string;
  status: string;
  verifiedOnChain: boolean;
  amountDisplay: string;
  tokenSymbol: string;
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
        <p className="max-w-md mx-auto text-[#C23B3B]">{error}</p>
      </PublicFrame>
    );
  }
  if (!proof) {
    return (
      <PublicFrame>
        <p className="text-center text-[#6B6B6B]">Loading</p>
      </PublicFrame>
    );
  }

  const payment = proof.payments[0];

  return (
    <PublicFrame>
      <div className="max-w-md mx-auto text-center pt-6">
        <p className="text-sm text-[#6B6B6B]">{proof.verifiedOnChain ? "Payment verified" : "Payment receipt"}</p>
        {proof.verifiedOnChain && (
          <div className="mx-auto mt-6 h-16 w-16 rounded-full bg-[#E7F5EE] text-[#0C7A4D] text-3xl flex items-center justify-center">
            ✓
          </div>
        )}
        <p className="mt-6 text-4xl tracking-tight">
          {proof.amountDisplay} {proof.tokenSymbol}
        </p>
        <p className="mt-3 text-[#6B6B6B]">{proof.businessName}</p>
        <p className="mt-1 text-sm text-[#8A8A8A]">{proof.invoiceNumber}</p>
        {payment && (
          <p className="mt-6 font-mono text-sm text-[#6B6B6B]">{shortenHash(payment.txHash)}</p>
        )}
        <div className="mt-8 text-left">
          <OnChainProof
            verified={proof.verifiedOnChain}
            txHash={payment?.txHash}
            explorerUrl={payment?.explorerUrl}
          />
        </div>
        {payment && (
          <a href={payment.explorerUrl} target="_blank" rel="noreferrer" className="inline-block mt-6">
            <Button>View on PolygonScan</Button>
          </a>
        )}
        <div className="mt-4 no-print">
          <Button variant="ghost" onClick={() => window.print()}>
            Download receipt
          </Button>
        </div>
      </div>
    </PublicFrame>
  );
}
