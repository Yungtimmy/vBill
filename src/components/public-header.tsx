"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/", label: "Product" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/docs", label: "Documentation" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-card border-b border-line">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-6 h-16 flex items-center gap-4">
        <BrandLogo size={40} />
        <nav className="hidden md:flex items-center gap-1 ml-2">
          {NAV.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 rounded-full text-sm text-muted hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden sm:inline-flex px-4 py-2 bg-purple text-white text-sm font-semibold rounded-full hover:bg-[#5B28D9]"
          >
            Connect wallet
          </Link>
          <button
            type="button"
            className="md:hidden h-10 w-10 rounded-xl border border-line flex items-center justify-center"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-line bg-card px-4 py-4 space-y-1">
          {NAV.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-3 rounded-2xl text-sm text-muted hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="block px-3 py-3 rounded-2xl text-sm font-semibold text-purple"
          >
            Connect wallet
          </Link>
        </div>
      )}
    </header>
  );
}
