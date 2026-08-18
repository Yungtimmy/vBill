"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DocSection } from "@/content/docs";

export function DocsSidebar({
  sections,
  current,
}: {
  sections: DocSection[];
  current?: string;
}) {
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="space-y-5" aria-label="Documentation sections">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {section.title}
          </p>
          <ul className="mt-2 space-y-1">
            {section.items.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/docs/${item.slug}`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block px-3 py-1.5 rounded-lg text-sm",
                    item.slug === current
                      ? "bg-lavender text-purple font-semibold"
                      : "text-muted hover:text-ink",
                  )}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile collapsible */}
      <div className="lg:hidden mb-6">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border border-line bg-card text-sm font-medium"
          aria-expanded={open}
        >
          <span>Documentation navigation</span>
          <ChevronDown size={16} className={open ? "rotate-180" : ""} />
        </button>
        {open && <div className="mt-3 border border-line rounded-2xl p-4 bg-card">{nav}</div>}
      </div>

      {/* Desktop sticky */}
      <aside className="hidden lg:block w-60 shrink-0">
        <div className="sticky top-24">{nav}</div>
      </aside>
    </>
  );
}
