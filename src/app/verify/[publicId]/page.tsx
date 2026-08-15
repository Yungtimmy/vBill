"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { StatusPill } from "@/components/ui";
import { shortenAddress, shortenHash } from "@/lib/addresses";

type Proof = {
  invoiceNumber: string;
  publicId: string;
  status: string;
  verifiedOnChain: boolean;
  amountDisplay: string;
  tokenSymbol: string;
  tokenAddress: string;
  chainId: number;
  chainName: string;
  merchantWallet: string;
  businessName: string;
  payments: {
    txHash: string;
    from: string | null;
    to: string | null;
    amountDisplay: string | null;
    blockNumber: string | null;
    confirmations: number;
    verifiedAt: string | null;
    explorerUrl: string;
  }[];
};

export default function VerifyPage() {
  const params = useParams<{ publicId: string }>();
  const [proof, setProof] = useState<Proof | null>(null);
  const [mode, setMode] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/verify/${params.publicId}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Not found.");
        setProof(json.proof);
        setMode(json.networkMode);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load."));
  }, [params.publicId]);

  if (error) {
    return (
      <main className="max-w-xl mx-auto px-6 py-28">
        <p className="text-[#C45C5C]">{error}</p>
      </main>
    );
  }
  if (!proof) {
    return (
      <main className="max-w-xl mx-auto px-6 py-28 font-mono text-xs tracking-[0.2em] uppercase text-[#6C6C74]">
        Loading proof
      </main>
    );
  }

  const payment = proof.payments[0];

  return (
    <main className="max-w-xl mx-auto px-6 py-16">
      <p className="font-mono text-xs tracking-[0.2em] text-[#6C6C74] uppercase mb-6">
        VerseBill payment proof
      </p>
      <h1 className="font-[family-name:var(--font-syne)] text-4xl tracking-tight mb-6">
        {proof.invoiceNumber}
      </h1>
      <StatusPill status={proof.status} />
      <p className="mt-6 text-lg">
        {proof.verifiedOnChain ? "Verified on-chain" : "No confirmed on-chain payment yet"}
      </p>
      <p className="text-[#6C6C74] text-sm mt-2">
        {mode === "production" ? "Production / Mainnet" : "Demo / Testnet"}
      </p>

      <dl className="mt-10 space-y-5">
        <Item label="Merchant" value={proof.businessName} />
        <Item label="Amount" value={`${proof.amountDisplay} ${proof.tokenSymbol}`} />
        <Item label="Token" value={`${proof.tokenSymbol} · ${shortenAddress(proof.tokenAddress)}`} />
        <Item label="Network" value={`${proof.chainName} (${proof.chainId})`} />
        <Item label="To" value={payment?.to ? payment.to : proof.merchantWallet} mono />
        {payment?.from && <Item label="From" value={shortenAddress(payment.from)} />}
        {payment && <Item label="Transaction" value={shortenHash(payment.txHash)} />}
        {payment?.blockNumber && <Item label="Block" value={`#${payment.blockNumber}`} />}
        {payment?.verifiedAt && (
          <Item
            label="Verified"
            value={new Date(payment.verifiedAt).toLocaleString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
        )}
      </dl>

      {payment && (
        <a
          href={payment.explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex mt-10 px-6 py-3 bg-[#EEEEEF] text-[#0F0F11] text-sm hover:bg-[#C9A227] hover:scale-95 transition-transform"
        >
          View on explorer
        </a>
      )}
    </main>
  );
}

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6C6C74]">{label}</dt>
      <dd className={`mt-1 ${mono ? "font-mono text-sm break-all" : ""}`}>{value}</dd>
    </div>
  );
}
