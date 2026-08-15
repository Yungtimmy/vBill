import { shortenHash } from "@/lib/addresses";

export function OnChainProof({
  verified,
  txHash,
  explorerUrl,
  compact = false,
}: {
  verified: boolean;
  txHash?: string | null;
  explorerUrl?: string | null;
  compact?: boolean;
}) {
  if (!verified) {
    return (
      <div className="border border-[#E6E4DE] rounded-xl p-5 bg-white">
        <p className="text-xs font-medium tracking-wide text-[#6B6B6B]">ON-CHAIN PROOF</p>
        <p className="mt-3 text-[#6B6B6B]">No confirmed payment yet.</p>
      </div>
    );
  }

  return (
    <div className="border border-[#CDE8D8] rounded-xl p-5 bg-[#F3FAF6]">
      <p className="text-xs font-medium tracking-wide text-[#0C7A4D]">ON-CHAIN PROOF</p>
      <p className="mt-2 text-lg font-medium">Payment verified</p>
      <ul className="mt-4 space-y-2 text-sm text-[#161616]">
        <li>✓ Polygon</li>
        <li>✓ VERSE contract</li>
        <li>✓ Merchant wallet</li>
        <li>✓ Exact amount</li>
        <li>✓ Transaction confirmed</li>
      </ul>
      {txHash && (
        <p className="mt-4 font-mono text-sm text-[#6B6B6B]">{shortenHash(txHash)}</p>
      )}
      {explorerUrl && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex mt-3 text-sm text-[#0C7A4D] underline ${compact ? "" : ""}`}
        >
          View on PolygonScan
        </a>
      )}
    </div>
  );
}
