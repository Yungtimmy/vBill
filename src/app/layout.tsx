import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { THEME_BOOT_SCRIPT } from "@/lib/theme-boot";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

// CSP nonce (set in middleware) is injected into inline scripts at render
// time. Static prerendering cannot carry a per-request nonce, which blocks
// Next's bootstrap scripts and blanks the page - keep pages server-rendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "VerseBill",
  description: "Invoices that prove payment on-chain.",
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  icons: { icon: "/image.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }}
        />
      </head>
      <body className={`${inter.variable} ${mono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
