"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createWalletClient, custom, type Hex } from "viem";
import { LoaderCircle } from "lucide-react";
import { Button, Check, Skeleton } from "@/components/ui";
import { OnChainProof } from "@/components/on-chain-proof";
import { PayCard, PublicFrame } from "@/components/public-frame";
import { erc20Abi } from "@/lib/erc20";
import { shortenHash } from "@/lib/addresses";
import { isPrivyConfigured } from "@/lib/privy-public";

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

type Phase = "ready" | "confirm" | "wallet" | "verifying" | "pending" | "confirmed" | "failed";

export default function PayPage() {
  const params = useParams<{ publicId: string }>();
  const [data, setData] = useState<PayPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [sentHash, setSentHash] = useState<string | null>(null);
  const polling = useRef(false);

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
      setPhase("pending");
    } else if (json.invoice.status === "FAILED") {
      setPhase("failed");
    }
    return json as PayPayload;
  }, [params.publicId]);

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Failed to load."));
  }, [load]);

  // Keep verifying until the payment reaches a terminal state, with
  // backoff, instead of giving up after a fixed window.
  const pollForConfirmation = useCallback(
    async (paymentId: string) => {
      if (polling.current) return;
      polling.current = true;
      try {
        let waitMs = 6_000;
        for (;;) {
          await new Promise((r) => setTimeout(r, waitMs));
          try {
            const res = await fetch(`/api/payments/${paymentId}/verify`, { method: "POST" });
            const json = await res.json();
            if (json.invoiceStatus === "PAID" || json.invoiceStatus === "OVERPAID") {
              setPhase("confirmed");
              await load();
              return;
            }
            if (json.invoiceStatus === "UNDERPAID") {
              setPhase("ready");
              setError("Amount received is less than the invoice.");
              await load();
              return;
            }
            if (json.invoiceStatus === "CANCELLED") {
              setPhase("failed");
              setError("This invoice has been cancelled by the merchant.");
              return;
            }
            if (json.payment?.status === "REJECTED" || json.payment?.status === "FAILED") {
              setPhase("failed");
              setError(json.reason || "Payment failed.");
              return;
            }
          } catch {
            // transient network/RPC error - keep waiting
          }
          waitMs = Math.min(waitMs * 1.5, 30_000);
        }
      } finally {
        polling.current = false;
      }
    },
    [load],
  );

  // If the user lands on (or returns to) the pending state with a
  // PROCESSING payment, resume verification instead of waiting forever.
  useEffect(() => {
    if (phase !== "pending" || !data) return;
    const payment = data.invoice.payments.find((p) => p.status === "PROCESSING");
    if (!payment) return;
    pollForConfirmation(payment.id);
  }, [phase, data, pollForConfirmation]);

  if (error && !data) {
    return (
      <PublicFrame>
        <p className="max-w-md mx-auto text-[#EF4444]">{error}</p>
      </PublicFrame>
    );
  }
  if (!data) {
    return (
      <PublicFrame>
        <PayCard className="max-w-md mx-auto text-center">
          <Skeleton className="h-4 w-40 mx-auto" />
          <Skeleton className="h-10 w-56 mx-auto mt-8" />
          <Skeleton className="h-4 w-20 mx-auto mt-4" />
          <Skeleton className="h-4 w-64 mx-auto mt-8" />
          <Skeleton className="h-12 w-full mt-8 rounded-2xl" />
        </PayCard>
      </PublicFrame>
    );
  }

  const paid = data.invoice.payments.find((p) => p.status === "CONFIRMED");
  const hash = sentHash ?? paid?.txHash ?? null;
  const explorer = hash ? `https://polygonscan.com/tx/${hash}` : null;

  if (phase === "confirmed") {
    return (
      <PublicFrame>
        <PayCard className="max-w-md mx-auto text-center">
          <div
            className="mx-auto h-16 w-16 rounded-full bg-[#E8F8F0] text-[#16A866] text-3xl font-bold flex items-center justify-center"
            style={{ boxShadow: "0 0 0 8px rgba(109,53,242,0.06), 0 0 40px rgba(22,139,255,0.18)" }}
          >
            ✓
          </div>
          <p className="mt-6 text-xl font-semibold">Payment verified</p>
          <p className="mt-4 text-[32px] font-bold tracking-tight">{data.invoice.amountDisplay} VERSE</p>
          <p className="mt-2 font-medium">{data.invoice.businessName}</p>
          <p className="mt-4 text-sm text-[#747180]">
            Payment successfully verified on the Polygon network.
          </p>
          <div className="mt-6 text-left space-y-2">
            <Check>VERSE token verified</Check>
            <Check>Recipient verified</Check>
            <Check>Amount verified</Check>
            <Check>Transaction confirmed</Check>
          </div>
          <div className="mt-6">
            <OnChainProof
              verified
              txHash={hash}
              explorerUrl={explorer}
              tokenAddress={data.invoice.tokenAddress}
              animate
            />
          </div>
          <div className="mt-6 flex flex-col gap-3">
            {explorer && (
              <a href={explorer} target="_blank" rel="noreferrer">
                <Button className="w-full">View transaction</Button>
              </a>
            )}
            <Link href={`/verify/${data.invoice.publicId}`}>
              <Button variant="ghost" className="w-full">
                View invoice
              </Button>
            </Link>
          </div>
        </PayCard>
      </PublicFrame>
    );
  }

  if (phase === "failed") {
    return (
      <PublicFrame>
        <PayCard className="max-w-md mx-auto text-center">
          <p className="text-xl font-semibold">Payment could not be verified</p>
          <p className="mt-3 text-sm text-[#747180]">
            Your funds have not been marked as received by the merchant.
          </p>
          <p className="mt-6 text-sm text-[#747180]">Reason</p>
          <p className="mt-1 font-medium">{error || "Transaction failed / verification failed."}</p>
          <div className="mt-8 flex flex-col gap-3">
            <Button className="w-full" onClick={() => setPhase("ready")}>
              Try again
            </Button>
            <Link href={`/pay/${data.invoice.publicId}`}>
              <Button variant="ghost" className="w-full">
                Return to invoice
              </Button>
            </Link>
          </div>
        </PayCard>
      </PublicFrame>
    );
  }

  if (phase === "pending") {
    return (
      <PublicFrame>
        <PayCard className="max-w-md mx-auto text-center">
          <p className="text-xl font-semibold">Payment submitted</p>
          <p className="mt-3 text-sm text-[#747180]">
            We&apos;re waiting for confirmation from the Polygon network.
          </p>
          {hash && (
            <>
              <p className="mt-6 text-sm text-[#747180]">Transaction</p>
              <p className="font-mono text-sm mt-1">{shortenHash(hash)}</p>
            </>
          )}
          <p className="mt-6 text-sm font-medium text-[#B45309]">Waiting for confirmation</p>
          <p className="mt-3 text-sm text-[#747180]">
            We keep checking automatically - this page will update itself once Polygon confirms the transaction.
          </p>
        </PayCard>
      </PublicFrame>
    );
  }

  if (phase === "wallet" || phase === "verifying") {
    return (
      <PublicFrame>
        <PayCard className="max-w-md mx-auto text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-[#F4F0FF] flex items-center justify-center">
            <LoaderCircle className="animate-spin text-[#6D35F2]" size={36} />
          </div>
          <p className="mt-6 text-xl font-semibold">
            {phase === "wallet" ? "Confirm in your wallet" : "Verifying payment..."}
          </p>
          <p className="mt-3 text-sm text-[#747180]">
            {phase === "wallet"
              ? "Approve the VERSE transfer in your wallet."
              : "We're confirming your transaction on Polygon."}
          </p>
        </PayCard>
      </PublicFrame>
    );
  }

  if (phase === "confirm") {
    return (
      <PublicFrame>
        <PayCard className="max-w-md mx-auto">
          <p className="text-center text-sm font-medium text-[#747180]">Confirm payment</p>
          <p className="text-center mt-6 text-sm text-[#747180]">You&apos;re paying</p>
          <p className="text-center mt-2 text-[32px] font-bold tracking-tight">
            {data.invoice.amountDisplay} VERSE
          </p>
          <div className="mt-8 space-y-4 text-sm">
            <div>
              <p className="text-[#747180]">To</p>
              <p className="mt-1 font-semibold">{data.invoice.businessName}</p>
              <p className="font-mono text-sm break-all mt-1">{data.invoice.merchantWallet}</p>
            </div>
            <div>
              <p className="text-[#747180]">Network</p>
              <p className="mt-1 font-semibold">Polygon</p>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <Check>Merchant verified</Check>
            <Check>Invoice verified</Check>
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
              onVerify={pollForConfirmation}
              label="Confirm & Pay"
            />
          )}
          {error && <p className="text-[#EF4444] mt-4">{error}</p>}
        </PayCard>
      </PublicFrame>
    );
  }

  return (
    <PublicFrame>
      <PayCard className="max-w-md mx-auto text-center">
        <p className="text-sm font-medium text-[#747180]">Payment request</p>
        <p className="mt-5 text-xs font-semibold tracking-wide text-[#747180] uppercase">
          {data.invoice.businessName}
        </p>
        <p className="mt-3 text-[32px] font-bold tracking-tight">{data.invoice.amountDisplay} VERSE</p>
        <p className="mt-3 text-sm text-[#747180]">Polygon</p>
        <p className="mt-4 text-sm font-medium text-[#16A866]">Merchant verified ✓</p>
        <div className="mt-6 text-left text-sm">
          <p className="text-[#747180]">Paying to</p>
          <p className="mt-1 font-mono text-sm break-all">{data.invoice.merchantWallet}</p>
        </div>
        {isPrivyConfigured() ? (
          <PayActions
            data={data}
            publicId={params.publicId}
            phase={phase}
            setPhase={setPhase}
            setError={setError}
            setSentHash={setSentHash}
            onReload={load}
            onVerify={pollForConfirmation}
            label={`Pay ${data.invoice.amountDisplay} VERSE`}
            preview
          />
        ) : (
          <p className="text-[#EF4444] mt-6">Wallet payment is unavailable until Privy is configured.</p>
        )}
        {error && <p className="text-[#EF4444] mt-4">{error}</p>}
        <Link href={`/verify/${data.invoice.publicId}`} className="block text-sm text-[#747180] mt-6">
          Payment receipt
        </Link>
      </PayCard>
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
  onVerify,
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
  onVerify: (paymentId: string) => Promise<void>;
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
      await onVerify(result.payment.id);
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
