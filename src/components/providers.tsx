"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { polygon, polygonAmoy } from "viem/chains";
import { isPrivyConfigured } from "@/lib/privy-public";

export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";
  if (!isPrivyConfigured()) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email", "wallet"],
        appearance: {
          theme: "dark",
          accentColor: "#C9A227",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain: polygon,
        supportedChains: [polygon, polygonAmoy],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
