const mode = (process.env.NEXT_PUBLIC_NETWORK_MODE ?? "demo").toLowerCase();

export function NetworkBanner() {
  const production = mode === "production";
  return (
    <div
      className={`w-full text-center font-mono text-[10px] uppercase tracking-[0.2em] py-2 border-b border-[#2A2A2F] ${
        production ? "text-[#6F8F72]" : "text-[#C9A227]"
      }`}
    >
      {production ? "Production / Mainnet — Polygon PoS · real VERSE" : "Demo / Testnet — not mainnet"}
    </div>
  );
}
