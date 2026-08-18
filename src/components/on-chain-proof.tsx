"use client";

import { CheckCircle2 } from "lucide-react";
import { shortenAddress, shortenHash } from "@/lib/addresses";

const CHECKS = [
  "VERSE token verified",
  "Recipient verified",
  "Amount verified",
  "Transaction confirmed",
];

export function OnChainProof({
  verified,
  txHash,
  explorerUrl,
  tokenAddress,
}: {
  verified: boolean;
  txHash?: string | null;
  explorerUrl?: string | null;
  tokenAddress?: string | null;
}) {
  if (!verified) {
    return (
      <div className="bg-card border border-line rounded-[22px] p-5">
        <p className="text-sm font-semibold text-muted">On-chain proof</p>
        <p className="mt-2 text-sm text-muted">No confirmed payment yet.</p>
      </div>
    );
  }

  return (
    <div
      className="fade-in rounded-[22px] p-px"
      style={{
        background: "linear-gradient(135deg, rgba(22,139,255,0.35), rgba(109,53,242,0.28), rgba(213,0,249,0.2))",
        boxShadow: "0 16px 40px -24px rgba(109,53,242,0.45)",
      }}
    >
      <div className="rounded-[21px] bg-card p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="text-success shrink-0 mt-0.5" size={22} />
          <div>
            <p className="text-lg font-semibold tracking-tight">Payment verified on-chain</p>
            <p className="mt-1 text-sm text-muted">
              This payment has been verified on the Polygon network.
            </p>
          </div>
        </div>
        <ul className="mt-5 space-y-2 text-sm text-ink">
          {CHECKS.map((label) => (
            <li key={label}>
              <span className="text-success">✓</span> {label}
            </li>
          ))}
        </ul>
        {txHash && (
          <div className="mt-5">
            <p className="text-xs text-muted">Transaction</p>
            <p className="font-mono text-sm mt-1">{shortenHash(txHash)}</p>
          </div>
        )}
        {explorerUrl && (
          <a href={explorerUrl} target="_blank" rel="noreferrer" className="inline-flex mt-3 text-sm font-medium text-purple">
            View on PolygonScan →
          </a>
        )}
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-muted">Technical details</summary>
          <dl className="mt-3 space-y-1 text-muted">
            <div className="flex justify-between gap-4">
              <dt>Network</dt>
              <dd className="text-ink">Polygon</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Token</dt>
              <dd className="text-ink">VERSE</dd>
            </div>
            {tokenAddress && (
              <div className="flex justify-between gap-4">
                <dt>Contract</dt>
                <dd className="font-mono text-ink">{shortenAddress(tokenAddress)}</dd>
              </div>
            )}
            {txHash && (
              <div className="flex justify-between gap-4">
                <dt>Transaction</dt>
                <dd className="font-mono text-ink">{shortenHash(txHash)}</dd>
              </div>
            )}
          </dl>
        </details>
      </div>
    </div>
  );
}
