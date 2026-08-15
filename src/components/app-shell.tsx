"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import { cn } from "@/lib/cn";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/invoices", label: "Invoices" },
  { href: "/customers", label: "Customers" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, logout } = usePrivy();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && !authenticated) {
      router.replace("/login");
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#6C6C74] font-mono text-xs tracking-[0.2em] uppercase">
        Loading
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-[#2A2A2F] px-6 py-5 flex items-center justify-between gap-6">
        <Link href="/dashboard" className="font-[family-name:var(--font-syne)] text-xl tracking-tight">
          VerseBill
        </Link>
        <nav className="hidden md:flex gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "font-mono text-[11px] uppercase tracking-[0.16em]",
                pathname.startsWith(l.href) ? "text-[#EEEEEF]" : "text-[#6C6C74]",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => logout()}
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#6C6C74] hover:text-[#EEEEEF]"
        >
          Sign out
        </button>
      </header>
      <div className="md:hidden border-b border-[#2A2A2F] px-6 py-3 flex gap-4 overflow-x-auto">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "font-mono text-[11px] uppercase tracking-[0.16em] whitespace-nowrap",
              pathname.startsWith(l.href) ? "text-[#EEEEEF]" : "text-[#6C6C74]",
            )}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <main className="max-w-6xl mx-auto px-6 py-12">{children}</main>
    </div>
  );
}
