export function MissingConfig({ feature }: { feature: string }) {
  return (
    <main className="max-w-xl mx-auto px-6 py-28">
      <p className="text-sm text-[#6B6B6B] mb-3">Configuration</p>
      <h1 className="text-3xl font-medium tracking-tight mb-4">{feature} is not configured</h1>
      <p className="text-[#6B6B6B] leading-relaxed">
        Set NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET, then reload. VerseBill will not invent a
        login or a wallet.
      </p>
    </main>
  );
}
