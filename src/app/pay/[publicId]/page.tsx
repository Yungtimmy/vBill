"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createWalletClient, custom, type Hex } from "viem";
import { Button, Card, StatusPill } from "@/components/ui";
import { erc20Abi } from "@/lib/erc20";
import { shortenAddress } from "@/lib/addresses";
import { isPrivyConfigured } from "@/lib/privy-public";

type PayPayload = {
  networkMode: "demo" | "production";
  network: {
    chainId: number;
    chainName: string;
    tokenSymbol: string;
    tokenAddress: string;
    tokenDecimals: number;
    gasToken: string;
    requiredConfirmations: number;
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
    receivedBaseUnits: string;
    receivedDisplay: string;
    remainingBaseUnits: string;
    remainingDisplay: string;
    items: { description: string; quantity: string; unitPrice: string }[];
    payments: { id: string; status: string; txHash: string; rejectReason?: string | null }[];
  };
};

type Phase =
  | "ready"
  | "wallet"
  | "submitted"
  | "verifying"
  | "confirmed"
  | "failed";

export default function PayPage() {
  const params = useParams<{ publicId: string }>();
  const [data, setData] = useState<PayPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [note, setNote] = useState<string>("Ready to pay");

  const load = useCallback(async () => {
    const res = await fetch(`/api/pay/${params.publicId}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Invoice not found.");
    setData(json);
    if (json.invoice.status === "PAID" || json.invoice.status === "OVERPAID") {
      setPhase("confirmed");
      setNote("Payment verified. Your payment has been confirmed on-chain.");
    } else if (json.invoice.status === "PROCESSING") {
      setPhase("verifying");
      setNote("Checking the blockchain.");
    } else if (json.invoice.status === "FAILED") {
      setPhase("failed");
      setNote("Payment failed. The on-chain transaction did not succeed.");
    } else {
      setPhase("ready");
      setNote("Ready to pay");
    }
    return json as PayPayload;
  }, [params.publicId]);

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Failed to load."));
  }, [load]);

  if (error && !data) {
    return (
      <main className="max-w-xl mx-auto px-6 py-28">
        <p className="text-[#C45C5C]">{error}</p>
      </main>
    );
  }
  if (!data) {
    return (
      <main className="max-w-xl mx-auto px-6 py-28 font-mono text-xs tracking-[0.2em] uppercase text-[#6C6C74]">
        Loading invoice
      </main>
    );
  }

  const payable =
    data.invoice.status === "PENDING" ||
    data.invoice.status === "UNDERPAID" ||
    data.invoice.status === "FAILED";

  return (
    <main className="max-w-xl mx-auto px-6 py-16">
      <p className="font-mono text-xs tracking-[0.2em] text-[#6C6C74] uppercase mb-6">
        VerseBill
      </p>
      <h1 className="font-[family-name:var(--font-syne)] text-4xl tracking-tight mb-2">
        Invoice {data.invoice.invoiceNumber}
      </h1>
      <p className="text-[#A0A0AB] mb-8">{data.invoice.businessName}</p>
      <StatusPill status={data.invoice.status} />

      <ul className="mt-10 divide-y divide-[#2A2A2F] border-y border-[#2A2A2F]">
        {data.invoice.items.map((item, i) => (
          <li key={i} className="py-4 flex justify-between">
            <span>
              {item.description} × {item.quantity}
            </span>
            <span>{item.unitPrice} VERSE</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 space-y-3">
        <Row label="Total" value={`${data.invoice.amountDisplay} VERSE`} />
        <Row label="Token" value="VERSE" />
        <Row label="Network" value={data.network.chainName} />
        <Row label="Destination" value={shortenAddress(data.invoice.merchantWallet)} mono />
        <Row label="Full destination" value={data.invoice.merchantWallet} mono />
        <Row label="Gas" value={`${data.network.gasToken} (not VERSE)`} />
      </div>

      {data.invoice.status === "UNDERPAID" && (
        <Card className="mt-8">
          <p>Expected: {data.invoice.amountDisplay} VERSE</p>
          <p>Received: {data.invoice.receivedDisplay} VERSE</p>
          <p>Remaining: {data.invoice.remainingDisplay} VERSE</p>
        </Card>
      )}

      <p className="mt-10 text-[#A0A0AB]">{note}</p>
      {error && <p className="mt-3 text-[#C45C5C]">{error}</p>}

      <div className="mt-8 flex flex-col gap-3">
        {payable && isPrivyConfigured() && (
          <PayActions
            data={data}
            publicId={params.publicId}
            phase={phase}
            setPhase={setPhase}
            setNote={setNote}
            setError={setError}
            onReload={load}
          />
        )}
        {payable && !isPrivyConfigured() && (
          <p className="text-[#C45C5C]">
            Wallet payment is unavailable until Privy is configured.
          </p>
        )}
        <Image
          src={`/api/pay/${data.invoice.publicId}/qr`}
          alt="Payment link QR code"
          width={160}
          height={160}
          className="mt-4"
          unoptimized
        />
        <Link
          href={`/verify/${data.invoice.publicId}`}
          className="text-sm text-[#A0A0AB] underline"
        >
          Open payment proof
        </Link>
      </div>
    </main>
  );
}

function PayActions({
  data,
  publicId,
  phase,
  setPhase,
  setNote,
  setError,
  onReload,
}: {
  data: PayPayload;
  publicId: string;
  phase: Phase;
  setPhase: (p: Phase) => void;
  setNote: (n: string) => void;
  setError: (n: string | null) => void;
  onReload: () => Promise<unknown>;
}) {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();

  async function pay() {
    setError(null);
    if (!authenticated) {
      login();
      return;
    }
    const wallet = wallets[0];
    if (!wallet) {
      setError("No wallet is available.");
      return;
    }
    setPhase("wallet");
    setNote("Confirm payment in your wallet");
    try {
      await wallet.switchChain(data.invoice.chainId);
      const provider = await wallet.getEthereumProvider();
      const chain = {
        id: data.network.chainId,
        name: data.network.chainName,
        nativeCurrency: {
          name: data.network.gasToken,
          symbol: data.network.gasToken,
          decimals: 18,
        },
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
      setPhase("submitted");
      setNote("Payment submitted. We're verifying your transaction.");
      const submit = await fetch(`/api/pay/${publicId}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ txHash: hash, fromAddress: wallet.address }),
      });
      const result = await submit.json();
      if (!submit.ok) {
        setPhase("failed");
        setNote(result.error || "Payment could not be recorded.");
        return;
      }
      setPhase("verifying");
      setNote(result.reason || "Checking the blockchain.");
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
          setNote("Payment verified. Your payment has been confirmed on-chain.");
          await onReload();
          return;
        }
        if (json.invoiceStatus === "UNDERPAID") {
          setPhase("ready");
          setNote(`Expected: ${data.invoice.amountDisplay} VERSE. Received is less than the invoice.`);
          await onReload();
          return;
        }
        if (json.payment?.status === "REJECTED" || json.payment?.status === "FAILED") {
          setPhase("failed");
          setNote(json.reason || "Payment failed.");
          return;
        }
        setNote(json.reason || "Checking the blockchain.");
      }
      await onReload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Wallet error.";
      setPhase("ready");
      if (/user rejected|denied/i.test(msg)) setError("Wallet rejected the transaction.");
      else if (/insufficient/i.test(msg)) {
        setError("Insufficient VERSE balance or insufficient POL for gas.");
      } else if (/network|chain/i.test(msg)) {
        setError("Wrong network. Switch to the network shown on this invoice.");
      } else setError(msg);
    }
  }

  return (
    <Button onClick={pay} disabled={!ready || phase === "wallet" || phase === "verifying"}>
      {authenticated ? "Pay with VERSE" : "Continue to pay"}
    </Button>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6C6C74]">
        {label}
      </span>
      <span className={mono ? "font-mono text-sm break-all" : ""}>{value}</span>
    </div>
  );
}


