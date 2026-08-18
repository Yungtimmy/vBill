const mode = (process.env.NEXT_PUBLIC_NETWORK_MODE ?? "demo").toLowerCase();

export function NetworkBanner() {
  const production = mode === "production";
  return (
    <div className="w-full text-center text-[11px] py-1.5 bg-lavender text-muted">
      {production ? "Polygon · mainnet VERSE" : "Demo / testnet · not mainnet"}
    </div>
  );
}
