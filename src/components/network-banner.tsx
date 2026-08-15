const mode = (process.env.NEXT_PUBLIC_NETWORK_MODE ?? "demo").toLowerCase();

export function NetworkBanner() {
  const production = mode === "production";
  return (
    <div className="w-full text-center text-[11px] py-1.5 border-b border-[#E6E4DE] bg-white text-[#6B6B6B]">
      {production ? "Polygon PoS · mainnet VERSE" : "Demo / testnet · not mainnet"}
    </div>
  );
}
