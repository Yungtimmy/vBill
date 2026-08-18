"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
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
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? sections
        .map((section) => {
          const sectionMatches = section.title.toLowerCase().includes(q);
          const items = sectionMatches
            ? section.items
            : section.items.filter((item) => `${item.title} ${item.slug}`.toLowerCase().includes(q));
          return { ...section, items };
        })
        .filter((section) => section.items.length > 0)
    : sections;

  // On mobile, typing expands the panel so results are visible immediately.
  const expanded = open || q.length > 0;

  const searchBox = (
    <div className="relative">
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search docs…"
        aria-label="Search documentation"
        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-line bg-card text-ink outline-none focus:border-purple placeholder:text-muted"
      />
    </div>
  );

  const nav = (
    <nav className="space-y-5" aria-label="Documentation sections">
      {filtered.length === 0 ? (
        <p className="text-sm text-muted px-1">No results for &quot;{query.trim()}&quot;.</p>
      ) : (
        filtered.map((section) => (
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
        ))
      )}
    </nav>
  );

  return (
    <>
      {/* Mobile: search + collapsible navigation */}
      <div className="lg:hidden mb-6 space-y-3">
        {searchBox}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border border-line bg-card text-sm font-medium"
          aria-expanded={expanded}
        >
          <span>Documentation navigation</span>
          <ChevronDown size={16} className={expanded ? "rotate-180" : ""} />
        </button>
        {expanded && <div className="border border-line rounded-2xl p-4 bg-card">{nav}</div>}
      </div>

      {/* Desktop: sticky search + navigation */}
      <aside className="hidden lg:block w-60 shrink-0">
        <div className="sticky top-24">
          {searchBox}
          <div className="mt-4">{nav}</div>
        </div>
      </aside>
    </>
  );
}
