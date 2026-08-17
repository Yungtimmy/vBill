export function MissingConfig({ feature }: { feature: string }) {
  return (
    <main className="max-w-xl mx-auto px-6 py-28">
      <p className="text-sm text-[#747180] mb-3">Configuration</p>
      <h1 className="text-[28px] font-bold tracking-tight mb-4">{feature} is not configured</h1>
      <p className="text-[#747180] leading-relaxed">
        Set NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET, then reload. VerseBill will not invent a
        login or a wallet.
      </p>
    </main>
  );
}
