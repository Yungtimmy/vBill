"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { BrandLogo } from "@/components/brand-logo";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/invoices", label: "Invoices" },
  { href: "/payments", label: "Payments" },
  { href: "/analytics", label: "Analytics" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, logout, user } = usePrivy();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initial = (user?.email?.address ?? "V").slice(0, 1).toUpperCase();

  useEffect(() => {
    if (ready && !authenticated) router.replace("/login");
  }, [ready, authenticated, router]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!ready || !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#747180] text-sm">
        Loading
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9FF] text-[#17151F]">
      <header className="sticky top-0 z-30 bg-white border-b border-[#E9E4F2]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <BrandLogo href="/dashboard" size={44} />
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm",
                  pathname.startsWith(l.href)
                    ? "bg-[#F4F0FF] text-[#6D35F2] font-semibold"
                    : "text-[#747180] hover:text-[#17151F]",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto hidden md:flex items-center gap-3">
            <span className="text-xs font-medium text-[#747180] px-3 py-1.5 rounded-full bg-[#F4F0FF]">
              Polygon
            </span>
            <Link
              href="/settings"
              className="h-9 w-9 rounded-full bg-[#6D35F2] text-white text-sm font-semibold flex items-center justify-center"
              aria-label="Settings"
            >
              {initial}
            </Link>
          </div>
          <button
            type="button"
            className="ml-auto md:hidden h-10 w-10 rounded-xl border border-[#E9E4F2] flex items-center justify-center"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {open && (
          <div className="md:hidden border-t border-[#E9E4F2] bg-white px-4 py-4 space-y-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "block px-3 py-3 rounded-2xl text-sm",
                  pathname.startsWith(l.href)
                    ? "bg-[#F4F0FF] text-[#6D35F2] font-semibold"
                    : "text-[#747180]",
                )}
              >
                {l.label}
              </Link>
            ))}
            <Link href="/settings" className="block px-3 py-3 rounded-2xl text-sm text-[#747180]">
              Settings
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="block w-full text-left px-3 py-3 rounded-2xl text-sm text-[#747180]"
            >
              Sign out
            </button>
          </div>
        )}
      </header>
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 md:py-10">{children}</main>
    </div>
  );
}
