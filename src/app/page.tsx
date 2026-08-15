import Link from "next/link";
import { GlowWord } from "@/components/glow-word";

export default function HomePage() {
  return (
    <div>
      <header className="px-6 py-6 flex items-center justify-between max-w-6xl mx-auto">
        <span className="font-[family-name:var(--font-syne)] text-xl">VerseBill</span>
        <Link
          href="/login"
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#A0A0AB] hover:text-[#EEEEEF]"
        >
          Sign in
        </Link>
      </header>

      <section className="px-6 py-28 border-t border-[#2A2A2F]">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs tracking-[0.2em] text-[#6C6C74] uppercase mb-6">
            On-chain invoices
          </p>
          <h1 className="font-[family-name:var(--font-syne)] text-5xl md:text-7xl tracking-tight leading-[0.95] max-w-4xl">
            Invoices that prove payment{" "}
            <GlowWord>on-chain</GlowWord>
          </h1>
          <p className="text-[#A0A0AB] text-lg leading-relaxed mt-8 max-w-xl">
            VerseBill does not ask anyone to blindly trust our database. A VERSE
            transfer is checked against Polygon before an invoice is marked paid.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="inline-flex items-center px-6 py-3 bg-[#EEEEEF] text-[#0F0F11] text-sm hover:bg-[#C9A227] hover:scale-95 active:scale-90 transition-transform"
            >
              Create an invoice
            </Link>
            <a
              href="#how"
              className="inline-flex items-center px-6 py-3 border border-[#2A2A2F] text-sm hover:bg-[#C9A227] hover:text-[#0F0F11] hover:scale-95 transition-transform"
            >
              How verification works
            </a>
          </div>
        </div>
      </section>

      <section id="how" className="px-6 py-28 border-t border-[#2A2A2F]">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs tracking-[0.2em] text-[#6C6C74] uppercase mb-6">
            The sequence
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-[#EEEEEF] tracking-tight leading-tight mb-6 font-[family-name:var(--font-syne)]">
            Invoice. Transfer. Independent proof.
          </h2>
          <p className="text-[#A0A0AB] text-lg leading-relaxed mb-12 max-w-2xl">
            Funds move from the customer wallet to the merchant wallet. VerseBill never holds VERSE.
          </p>
          <ol className="max-w-2xl space-y-8">
            {[
              ["01", "Merchant issues an invoice with a locked destination, amount, token, and chain."],
              ["02", "Customer opens the public link, reviews every field, and signs a VERSE transfer."],
              ["03", "The backend reads the Polygon receipt and decodes the Transfer event."],
              ["04", "Paid only if the official VERSE contract, recipient, amount, and confirmations match."],
            ].map(([n, t]) => (
              <li key={n} className="flex gap-6">
                <span className="font-mono text-xs tracking-[0.2em] text-[#C9A227] pt-1">{n}</span>
                <p className="text-[#EEEEEF] text-lg leading-relaxed">{t}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-6 py-28 border-t border-[#2A2A2F]">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-xs tracking-[0.2em] text-[#6C6C74] uppercase mb-6">
            What we refuse
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-6 font-[family-name:var(--font-syne)]">
            The frontend cannot mark an invoice paid.
          </h2>
          <p className="text-[#A0A0AB] text-lg leading-relaxed max-w-2xl">
            A submitted transaction hash is only a claim. VerseBill queries Polygon, checks the
            trusted VERSE contract
            <span className="font-mono text-sm text-[#EEEEEF]"> 0xc708…8fec</span>, and stores the
            proof. Anyone can open the public verification page and follow the explorer link.
          </p>
        </div>
      </section>

      <section className="px-6 py-28 border-t border-[#2A2A2F]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-[#6C6C74] uppercase mb-6">
              Start
            </p>
            <h2 className="text-4xl font-[family-name:var(--font-syne)] tracking-tight">
              Email in. Wallet ready. Invoice out.
            </h2>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 bg-[#EEEEEF] text-[#0F0F11] text-sm hover:bg-[#C9A227] hover:scale-95 transition-transform"
          >
            Open the dashboard
          </Link>
        </div>
      </section>

      <footer className="px-6 py-10 border-t border-[#2A2A2F] text-[#6C6C74] text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-4">
          <span>VerseBill</span>
          <span>Non-custodial invoicing for VERSE on Polygon PoS.</span>
        </div>
      </footer>
    </div>
  );
}
