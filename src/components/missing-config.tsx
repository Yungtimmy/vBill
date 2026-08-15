export function MissingConfig({ feature }: { feature: string }) {
  return (
    <main className="max-w-xl mx-auto px-6 py-28">
      <p className="font-mono text-xs tracking-[0.2em] text-[#6C6C74] uppercase mb-6">
        Configuration
      </p>
      <h1 className="font-[family-name:var(--font-syne)] text-4xl tracking-tight mb-6">
        {feature} is not configured
      </h1>
      <p className="text-[#A0A0AB] leading-relaxed">
        Set NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET, then reload. VerseBill will not
        invent a login or a wallet.
      </p>
    </main>
  );
}
