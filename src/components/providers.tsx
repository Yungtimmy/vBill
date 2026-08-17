"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { isPrivyConfigured } from "@/lib/privy-public";
import { polygon, polygonAmoy } from "@/lib/privy-chains";

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
          theme: "light",
          accentColor: "#6D35F2",
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
