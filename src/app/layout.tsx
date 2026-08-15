import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk, Syne } from "next/font/google";
import { Providers } from "@/components/providers";
import { NetworkBanner } from "@/components/network-banner";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-syne",
});

const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-space",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "VerseBill",
  description: "Invoices that prove payment on-chain.",
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${space.variable} ${mono.variable} antialiased`}>
        <Providers>
          <NetworkBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
