"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createWalletClient, custom, type Hex } from "viem";
import { Button, Check } from "@/components/ui";
import { OnChainProof } from "@/components/on-chain-proof";
import { PublicFrame } from "@/components/public-frame";
import { erc20Abi } from "@/lib/erc20";
import { shortenAddress, shortenHash } from "@/lib/addresses";
import { isPrivyConfigured } from "@/lib/privy-public";
import { formatDate } from "@/lib/status";

type PayPayload = {
  network: {
    chainId: number;
    chainName: string;
    gasToken: string;
  };
  invoice: {
    publicId: string;
    invoiceNumber: string;
    status: string;
    businessName: string;
    merchantWallet: string;
    tokenAddress: string;
    chainId: number;
    amountBaseUnits: string;
    amountDisplay: string;
    remainingBaseUnits: string;
    dueDate?: string | null;
    payments: { id: string; status: string; txHash: string }[];
  };
};

type Phase = "ready" | "confirm" | "wallet" | "verifying" | "confirmed" | "failed";

export default function PayPage() {
  const params = useParams<{ publicId: string }>();
  const [data, setData] = useState<PayPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [sentHash, setSentHash] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/pay/${params.publicId}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Invoice not found.");
    setData(json);
    if (json.invoice.status === "PAID" || json.invoice.status === "OVERPAID") {
      setPhase("confirmed");
      const paid = json.invoice.payments?.find((p: { status: string }) => p.status === "CONFIRMED");
      if (paid?.txHash) setSentHash(paid.txHash);
    } else if (json.invoice.status === "PROCESSING") {
      setPhase("verifying");
    } else if (json.invoice.status === "FAILED") {
      setPhase("failed");
    }
    return json as PayPayload;
  }, [params.publicId]);

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Failed to load."));
  }, [load]);

  if (error && !data) {
    return (
      <PublicFrame>
        <p className="max-w-md mx-auto text-[#C23B3B]">{error}</p>
      </PublicFrame>
    );
  }
  if (!data) {
    return (
      <PublicFrame>
        <p className="text-center text-[#6B6B6B]">Loading</p>
      </PublicFrame>
    );
  }

  const paid = data.invoice.payments.find((p) => p.status === "CONFIRMED");
  const hash = sentHash ?? paid?.txHash ?? null;
  const explorer = hash ? `https://polygonscan.com/tx/${hash}` : null;

  if (phase === "confirmed") {
    return (
      <PublicFrame>
        <div className="max-w-md mx-auto text-center pt-8">
          <p className="text-sm text-[#6B6B6B]">Payment sent</p>
          <div className="mx-auto mt-8 h-16 w-16 rounded-full bg-[#E7F5EE] text-[#0C7A4D] text-3xl flex items-center justify-center">
            ✓
          </div>
          <p className="mt-8 text-4xl tracking-tight">{data.invoice.amountDisplay} VERSE</p>
          <p className="mt-3 text-[#6B6B6B]">Transaction verified</p>
          <p className="mt-8 text-sm text-[#6B6B6B]">Polygon</p>
          {hash && <p className="font-mono text-sm mt-1">{shortenHash(hash)}</p>}
          <div className="mt-8 space-y-2 text-left max-w-xs mx-auto">
            <Check>Recipient matched</Check>
            <Check>Amount matched</Check>
            <Check>VERSE contract matched</Check>
            <Check>On-chain confirmation</Check>
          </div>
          {explorer && (
            <a href={explorer} target="_blank" rel="noreferrer" className="inline-block mt-8">
              <Button>View on PolygonScan</Button>
            </a>
          )}
          <div className="mt-8">
            <OnChainProof verified txHash={hash} explorerUrl={explorer} />
          </div>
        </div>
      </PublicFrame>
    );
  }

  if (phase === "confirm") {
    return (
      <PublicFrame>
        <div className="max-w-md mx-auto pt-4">
          <p className="text-sm text-[#6B6B6B] text-center">Confirm payment</p>
          <p className="text-center mt-6 text-[#6B6B6B]">You are paying</p>
          <p className="text-center text-4xl tracking-tight mt-2">{data.invoice.amountDisplay} VERSE</p>
          <div className="mt-10 space-y-5 text-sm">
            <div>
              <p className="text-[#6B6B6B]">To</p>
              <p className="mt-1 font-medium">{data.invoice.businessName}</p>
              <p className="font-mono text-[#6B6B6B]">{shortenAddress(data.invoice.merchantWallet)}</p>
            </div>
            <div>
              <p className="text-[#6B6B6B]">Network</p>
              <p className="mt-1 font-medium">Polygon</p>
            </div>
          </div>
          {isPrivyConfigured() && (
            <PayActions
              data={data}
              publicId={params.publicId}
              phase={phase}
              setPhase={setPhase}
              setError={setError}
              setSentHash={setSentHash}
              onReload={load}
              label="Confirm and pay"
            />
          )}
          {error && <p className="text-[#C23B3B] mt-4">{error}</p>}
        </div>
      </PublicFrame>
    );
  }

  return (
    <PublicFrame>
      <div className="max-w-md mx-auto pt-4">
        <p className="text-center text-sm text-[#6B6B6B]">Payment request</p>
        <div className="mt-6 bg-white border border-[#E6E4DE] rounded-2xl px-6 py-10 text-center">
          <p className="text-4xl tracking-tight">{data.invoice.amountDisplay} VERSE</p>
          <p className="mt-4 font-medium tracking-wide">{data.invoice.businessName}</p>
        </div>
        {data.invoice.dueDate && (
          <p className="text-center text-sm text-[#6B6B6B] mt-4">Due {formatDate(data.invoice.dueDate)}</p>
        )}
        <dl className="mt-8 space-y-4 text-sm">
          <div>
            <dt className="text-[#6B6B6B]">Network</dt>
            <dd className="mt-1 font-medium">Polygon</dd>
          </div>
          <div>
            <dt className="text-[#6B6B6B]">Paying to</dt>
            <dd className="mt-1 font-mono">{shortenAddress(data.invoice.merchantWallet)}</dd>
          </div>
        </dl>
        {phase === "verifying" || phase === "wallet" ? (
          <p className="mt-8 text-center text-[#C4841D]">
            {phase === "wallet" ? "Confirm in your wallet" : "Transaction verified. Confirming on-chain."}
          </p>
        ) : (
          <div className="mt-8">
            {isPrivyConfigured() ? (
              <PayActions
                data={data}
                publicId={params.publicId}
                phase={phase}
                setPhase={setPhase}
                setError={setError}
                setSentHash={setSentHash}
                onReload={load}
                label={`Pay ${data.invoice.amountDisplay} VERSE`}
                preview
              />
            ) : (
              <p className="text-[#C23B3B]">Wallet payment is unavailable until Privy is configured.</p>
            )}
          </div>
        )}
        {error && <p className="text-[#C23B3B] mt-4">{error}</p>}
        <div className="mt-8 space-y-2">
          <Check>Recipient verified</Check>
          <Check>Token verified</Check>
          <Check>Invoice verified</Check>
        </div>
        <p className="mt-6 text-center text-sm text-[#6B6B6B]">Verified merchant</p>
        <Link href={`/verify/${data.invoice.publicId}`} className="block text-center text-sm underline mt-6 text-[#6B6B6B]">
          Payment receipt
        </Link>
      </div>
    </PublicFrame>
  );
}

function PayActions({
  data,
  publicId,
  phase,
  setPhase,
  setError,
  setSentHash,
  onReload,
  label,
  preview,
}: {
  data: PayPayload;
  publicId: string;
  phase: Phase;
  setPhase: (p: Phase) => void;
  setError: (n: string | null) => void;
  setSentHash: (h: string | null) => void;
  onReload: () => Promise<unknown>;
  label: string;
  preview?: boolean;
}) {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();

  async function start() {
    setError(null);
    if (!authenticated) {
      login();
      return;
    }
    if (preview && phase === "ready") {
      setPhase("confirm");
      return;
    }
    await send();
  }

  async function send() {
    const wallet = wallets[0];
    if (!wallet) {
      setError("No wallet is available.");
      return;
    }
    setPhase("wallet");
    try {
      await wallet.switchChain(data.invoice.chainId);
      const provider = await wallet.getEthereumProvider();
      const chain = {
        id: data.network.chainId,
        name: data.network.chainName,
        nativeCurrency: { name: data.network.gasToken, symbol: data.network.gasToken, decimals: 18 },
        rpcUrls: { default: { http: [] as string[] } },
      };
      const walletClient = createWalletClient({
        account: wallet.address as Hex,
        chain,
        transport: custom(provider),
      });
      const payAmount =
        data.invoice.status === "UNDERPAID"
          ? BigInt(data.invoice.remainingBaseUnits)
          : BigInt(data.invoice.amountBaseUnits);
      const hash = await walletClient.writeContract({
        address: data.invoice.tokenAddress as Hex,
        abi: erc20Abi,
        functionName: "transfer",
        args: [data.invoice.merchantWallet as Hex, payAmount],
        account: wallet.address as Hex,
        chain,
      });
      setSentHash(hash);
      setPhase("verifying");
      const submit = await fetch(`/api/pay/${publicId}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ txHash: hash, fromAddress: wallet.address }),
      });
      const result = await submit.json();
      if (!submit.ok) {
        setPhase("failed");
        setError(result.error || "Payment could not be recorded.");
        return;
      }
      if (!result.payment?.id) {
        await onReload();
        return;
      }
      for (let i = 0; i < 20; i += 1) {
        await new Promise((r) => setTimeout(r, 3000));
        const res = await fetch(`/api/payments/${result.payment.id}/verify`, { method: "POST" });
        const json = await res.json();
        if (json.invoiceStatus === "PAID" || json.invoiceStatus === "OVERPAID") {
          setPhase("confirmed");
          await onReload();
          return;
        }
        if (json.invoiceStatus === "UNDERPAID") {
          setPhase("ready");
          setError("Amount received is less than the invoice.");
          await onReload();
          return;
        }
        if (json.payment?.status === "REJECTED" || json.payment?.status === "FAILED") {
          setPhase("failed");
          setError(json.reason || "Payment failed.");
          return;
        }
      }
      await onReload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Wallet error.";
      setPhase(preview ? "ready" : "confirm");
      if (/user rejected|denied/i.test(msg)) setError("Wallet rejected the transaction.");
      else if (/insufficient/i.test(msg)) setError("Insufficient VERSE or POL for gas.");
      else if (/network|chain/i.test(msg)) setError("Wrong network. Switch to Polygon.");
      else setError(msg);
    }
  }

  return (
    <Button className="w-full mt-6" onClick={start} disabled={!ready || phase === "wallet" || phase === "verifying"}>
      {authenticated ? label : "Continue with email"}
    </Button>
  );
}
