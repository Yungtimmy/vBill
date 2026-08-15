"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import { cn } from "@/lib/cn";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/invoices", label: "Invoices" },
  { href: "/payments", label: "Payments" },
  { href: "/customers", label: "Clients" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, logout, user } = usePrivy();
  const router = useRouter();
  const pathname = usePathname();
  const initial = (user?.email?.address ?? "V").slice(0, 1).toUpperCase();

  useEffect(() => {
    if (ready && !authenticated) {
      router.replace("/login");
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#6B6B6B] text-sm">
        Loading
      </div>
    );
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[220px_1fr]">
      <aside className="border-b md:border-b-0 md:border-r border-[#E6E4DE] bg-white">
        <div className="px-5 py-5 flex items-center justify-between">
          <Link href="/dashboard" className="font-[family-name:var(--font-syne)] text-lg tracking-tight">
            VerseBill
          </Link>
          <div className="h-8 w-8 rounded-full bg-[#E7F5EE] text-[#0C7A4D] text-sm font-medium flex items-center justify-center">
            {initial}
          </div>
        </div>
        <nav className="px-3 pb-4 flex md:flex-col gap-1 overflow-x-auto">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "px-3 py-2 rounded-md text-sm whitespace-nowrap",
                pathname.startsWith(l.href)
                  ? "bg-[#F6F5F2] text-[#161616] font-medium"
                  : "text-[#6B6B6B] hover:text-[#161616]",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:block px-5 py-4 mt-auto">
          <button onClick={() => logout()} className="text-sm text-[#6B6B6B] hover:text-[#161616]">
            Sign out
          </button>
        </div>
      </aside>
      <main className="px-6 py-8 md:px-10 md:py-10 max-w-5xl">{children}</main>
    </div>
  );
}
