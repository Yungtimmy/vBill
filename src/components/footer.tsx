import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { VERSE_ECOSYSTEM_URL, xUrl } from "@/lib/links";

function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function Column({ title, links }: { title: string; links: React.ReactNode[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link, i) => (
          <li key={i} className="text-sm text-muted hover:text-ink">
            {link}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Internal({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href}>{children}</Link>;
}

export function Footer() {
  const x = xUrl();

  return (
    <footer className="border-t border-line bg-card">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.6fr_repeat(4,minmax(0,1fr))] md:gap-8">
          <div className="max-w-xs">
            <BrandLogo size={40} />
            <p className="mt-4 text-sm text-muted leading-relaxed">
              Simple, verifiable on-chain invoicing and payments powered by the Verse ecosystem.
            </p>
          </div>

          <Column
            title="Product"
            links={[
              <Internal key="d" href="/dashboard">Dashboard</Internal>,
              <Internal key="i" href="/invoices">Invoices</Internal>,
              <Internal key="p" href="/payments">Payments</Internal>,
              <Internal key="h" href="/how-it-works">How it Works</Internal>,
            ]}
          />

          <Column
            title="Resources"
            links={[
              <Internal key="doc" href="/docs">Documentation</Internal>,
              <Internal key="faq" href="/faq">FAQ</Internal>,
              <Internal key="about" href="/about">About</Internal>,
            ]}
          />

          <Column
            title="Community"
            links={[
              ...(x
                ? [
                    <a
                      key="x"
                      href={x}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="VerseBill on X"
                      className="inline-flex items-center gap-2"
                    >
                      <XIcon />
                      X
                    </a>,
                  ]
                : []),
              <a
                key="verse"
                href={VERSE_ECOSYSTEM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Verse ecosystem"
              >
                Verse Community
              </a>,
            ]}
          />

          <Column
            title="Legal"
            links={[
              <Internal key="privacy" href="/privacy">Privacy Policy</Internal>,
              <Internal key="terms" href="/terms">Terms of Service</Internal>,
            ]}
          />
        </div>

        <div className="mt-12 md:mt-16 pt-6 border-t border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-muted">
          <p>© 2026 VerseBill</p>
          <p>Built for the Verse ecosystem.</p>
        </div>
      </div>
    </footer>
  );
}
