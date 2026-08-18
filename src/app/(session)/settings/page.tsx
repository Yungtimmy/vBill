"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createWalletClient, custom, isAddress, parseUnits, type Hex } from "viem";
import { AppShell } from "@/components/app-shell";
import { Button, Card, Input, Label, Skeleton, Spinner } from "@/components/ui";
import { useAccountBootstrap } from "@/components/bootstrap";
import { api, formatError } from "@/lib/client-api";
import { isPrivyConfigured } from "@/lib/privy-public";
import { MissingConfig } from "@/components/missing-config";
import { erc20Abi } from "@/lib/erc20";

type Settings = {
  businessName: string;
  businessEmail?: string | null;
  logo?: string | null;
  walletAddress: string;
};

type WalletInfo = {
  walletAddress: string;
  network: {
    chainId: number;
    chainName: string;
    tokenSymbol: string;
    tokenAddress: string;
    tokenDecimals: number;
    gasToken: string;
    explorerUrl: string;
  };
  verseBaseUnits: string | null;
  polBaseUnits: string | null;
  verseDisplay: string | null;
  polDisplay: string | null;
  balancesReachable: boolean;
};

export default function SettingsPage() {
  if (!isPrivyConfigured()) return <MissingConfig feature="Settings" />;
  return <SettingsInner />;
}

function SettingsInner() {
  const { readyOnServer } = useAccountBootstrap();
  const { authenticated, login, exportWallet } = usePrivy();
  const { wallets } = useWallets();

  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [wallet, setWallet] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [info, setInfo] = useState<WalletInfo | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(false);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [token, setToken] = useState<"VERSE" | "POL">("VERSE");
  const [amount, setAmount] = useState("");
  const [dest, setDest] = useState("");
  const [wdPhase, setWdPhase] = useState<"form" | "signing" | "sent">("form");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [wdError, setWdError] = useState<string | null>(null);

  useEffect(() => {
    if (!readyOnServer) return;
    api<{ settings: Settings }>("/api/settings")
      .then((d) => {
        setBusinessName(d.settings.businessName);
        setBusinessEmail(d.settings.businessEmail ?? "");
        setLogo(d.settings.logo ?? null);
        setWallet(d.settings.walletAddress);
      })
      .catch((err) => setError(formatError(err)));
  }, [readyOnServer]);

  async function loadBalances() {
    setBalancesLoading(true);
    try {
      const d = await api<WalletInfo>("/api/settings/wallet");
      setInfo(d);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setBalancesLoading(false);
    }
  }

  useEffect(() => {
    if (!readyOnServer) return;
    loadBalances().catch(() => undefined);
  }, [readyOnServer]);

  async function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setLogo(dataUrl);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read image.");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          businessName,
          businessEmail: businessEmail || undefined,
          logo: logo ?? "",
        }),
      });
      setSaved(true);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setSaving(false);
    }
  }

  function openWithdraw() {
    setWithdrawOpen(true);
    setToken("VERSE");
    setAmount("");
    setDest("");
    setWdPhase("form");
    setTxHash(null);
    setWdError(null);
  }

  function useMax() {
    if (!info) return;
    const max = token === "VERSE" ? info.verseDisplay : info.polDisplay;
    setAmount(max ?? "");
  }

  async function sendWithdraw() {
    setWdError(null);
    const walletInfo = wallets[0];
    if (!info) return;
    if (!authenticated) {
      login();
      return;
    }
    if (!walletInfo) {
      setWdError("No wallet is available. Connect a wallet first.");
      return;
    }
    const destAddress = dest.trim();
    if (!isAddress(destAddress, { strict: false })) {
      setWdError("Destination address is invalid.");
      return;
    }
    if (!/^\d+(\.\d+)?$/.test(amount) || amount === "0") {
      setWdError("Enter an amount greater than zero.");
      return;
    }
    setWdPhase("signing");
    try {
      await walletInfo.switchChain(info.network.chainId);
      const provider = await walletInfo.getEthereumProvider();
      const chain = {
        id: info.network.chainId,
        name: info.network.chainName,
        nativeCurrency: {
          name: info.network.gasToken,
          symbol: info.network.gasToken,
          decimals: 18,
        },
        rpcUrls: { default: { http: [] as string[] } },
      };
      const walletClient = createWalletClient({
        account: walletInfo.address as Hex,
        chain,
        transport: custom(provider),
      });
      const hash =
        token === "VERSE"
          ? await walletClient.writeContract({
              address: info.network.tokenAddress as Hex,
              abi: erc20Abi,
              functionName: "transfer",
              args: [destAddress as Hex, parseUnits(amount, info.network.tokenDecimals)],
              account: walletInfo.address as Hex,
              chain,
            })
          : await walletClient.sendTransaction({
              to: destAddress as Hex,
              value: parseUnits(amount, 18),
              account: walletInfo.address as Hex,
              chain,
            });
      setTxHash(hash);
      setWdPhase("sent");
      loadBalances().catch(() => undefined);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Wallet error.";
      setWdPhase("form");
      if (/user rejected|denied/i.test(msg)) setWdError("Wallet rejected the transaction.");
      else if (/insufficient/i.test(msg)) setWdError("Insufficient balance or POL for gas.");
      else setWdError(msg);
    }
  }

  const explorer = txHash && info ? `${info.network.explorerUrl}/tx/${txHash}` : null;

  return (
    <AppShell>
      <div className="max-w-xl">
        <h1 className="text-[28px] font-bold tracking-tight mb-6">Settings</h1>

        <Card>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-[#F4F0FF] border border-[#E9E4F2] overflow-hidden flex items-center justify-center text-[#6D35F2] font-bold text-xl shrink-0">
                {logo ? <img src={logo} alt="Business logo" className="h-full w-full object-cover" /> : "VB"}
              </div>
              <div>
                <Button type="button" variant="ghost" onClick={() => fileRef.current?.click()}>
                  Upload logo
                </Button>
                {logo && (
                  <button
                    type="button"
                    className="block mt-2 text-sm text-[#EF4444]"
                    onClick={() => setLogo(null)}
                  >
                    Remove logo
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onLogoChange}
                />
              </div>
            </div>
            <div>
              <Label>Business name</Label>
              <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
            </div>
            <div>
              <Label>Business email</Label>
              <Input type="email" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} />
            </div>
            {error && <p className="text-[#EF4444]">{error}</p>}
            {saved && <p className="text-[#16A866]">Saved.</p>}
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Spinner className="mr-2" /> Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </form>
        </Card>

        <Card className="mt-4">
          <p className="text-sm font-semibold mb-3">Wallet</p>
          <p className="font-mono text-sm break-all text-[#747180]">{wallet || "—"}</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#FAF9FF] border border-[#E9E4F2] p-4">
              <p className="text-xs font-semibold text-[#747180]">VERSE balance</p>
              <p className="mt-1 text-lg font-bold">
                {balancesLoading ? <Skeleton className="h-7 w-24" /> : info?.verseDisplay ?? "—"}
              </p>
            </div>
            <div className="rounded-2xl bg-[#FAF9FF] border border-[#E9E4F2] p-4">
              <p className="text-xs font-semibold text-[#747180]">POL balance</p>
              <p className="mt-1 text-lg font-bold">
                {balancesLoading ? <Skeleton className="h-7 w-24" /> : info?.polDisplay ?? "—"}
              </p>
            </div>
          </div>
          {!balancesLoading && info && !info.balancesReachable && (
            <p className="mt-3 text-xs text-[#B45309]">Balances unavailable - RPC not reachable.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" onClick={openWithdraw} disabled={!info}>
              Withdraw
            </Button>
            <Button type="button" variant="ghost" onClick={loadBalances} disabled={balancesLoading}>
              {balancesLoading ? "Refreshing…" : "Refresh balances"}
            </Button>
            <Link href="/settings/wallet" className="inline-flex items-center text-sm font-medium text-[#6D35F2] px-1">
              Change payment wallet
            </Link>
          </div>
        </Card>

        <Card className="mt-4">
          <p className="text-sm font-semibold mb-2">Export wallet key</p>
          <p className="text-sm text-[#747180] mb-4">
            Exports the private key of your embedded wallet through Privy&apos;s official flow. Anyone with this key
            controls your funds - keep it safe.
          </p>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              try {
                exportWallet();
              } catch {
                setError("Wallet export is not available in this session.");
              }
            }}
          >
            Export wallet key
          </Button>
        </Card>

        {withdrawOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#17151F]/40 p-4"
            onClick={() => {
              if (wdPhase !== "signing") setWithdrawOpen(false);
            }}
          >
            <div
              className="w-full max-w-md bg-white rounded-[22px] p-6 shadow-[0_24px_64px_-16px_rgba(23,21,31,0.35)]"
              onClick={(e) => e.stopPropagation()}
            >
              {wdPhase === "sent" && txHash ? (
                <>
                  <h2 className="text-lg font-bold text-[#17151F]">Transaction sent</h2>
                  <p className="mt-2 text-sm text-[#747180] break-all">Tx: {txHash}</p>
                  {explorer && (
                    <a href={explorer} target="_blank" rel="noreferrer" className="block text-sm text-[#6D35F2] mt-3">
                      View on explorer
                    </a>
                  )}
                  <div className="mt-6 flex gap-3">
                    <Button type="button" variant="ghost" onClick={() => setWithdrawOpen(false)}>
                      Close
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-[#17151F]">Withdraw</h2>
                  <p className="mt-1 text-sm text-[#747180]">Send {token} from your wallet to another address.</p>
                  <div className="mt-5 space-y-4">
                    <div>
                      <Label>Token</Label>
                      <div className="flex gap-2">
                        {(["VERSE", "POL"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setToken(t)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold ${
                              token === t
                                ? "bg-[#6D35F2] text-white"
                                : "bg-white border border-[#E9E4F2] text-[#747180]"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Amount</Label>
                      <div className="flex gap-2">
                        <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.0" inputMode="decimal" />
                        <Button type="button" variant="ghost" onClick={useMax}>
                          Max
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>Destination address</Label>
                      <Input
                        value={dest}
                        onChange={(e) => setDest(e.target.value)}
                        placeholder="0x…"
                        className="font-mono"
                      />
                    </div>
                    {wdError && <p className="text-[#EF4444] text-sm">{wdError}</p>}
                    <div className="flex gap-3 pt-1">
                      <Button
                        type="button"
                        onClick={sendWithdraw}
                        disabled={wdPhase === "signing" || !authenticated}
                      >
                        {wdPhase === "signing" ? (
                          <>
                            <Spinner className="mr-2" /> Confirm in wallet…
                          </>
                        ) : authenticated ? (
                          "Withdraw"
                        ) : (
                          "Continue with email"
                        )}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setWithdrawOpen(false)} disabled={wdPhase === "signing"}>
                        Close
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Image processing is unavailable."));
          return;
        }
        const scale = Math.min(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Could not read image."));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}
