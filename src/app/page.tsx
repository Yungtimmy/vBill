import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <header className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto">
        <span className="font-[family-name:var(--font-syne)] text-lg tracking-tight">VerseBill</span>
        <Link href="/login" className="text-sm text-[#6B6B6B] hover:text-[#161616]">
          Sign in
        </Link>
      </header>

      <section className="px-6 py-24 max-w-5xl mx-auto">
        <p className="text-sm text-[#0C7A4D] mb-4">Invoices that prove payment</p>
        <h1 className="text-5xl md:text-6xl tracking-tight font-medium max-w-3xl leading-[1.05]">
          Get paid in VERSE. Verify it on-chain.
        </h1>
        <p className="text-[#6B6B6B] text-lg mt-6 max-w-xl leading-relaxed">
          Create an invoice, share a link, and accept VERSE on Polygon. VerseBill checks the
          blockchain before anything is marked paid.
        </p>
        <div className="mt-10 flex gap-3">
          <Link
            href="/login"
            className="inline-flex px-5 py-3 bg-[#0C7A4D] text-[#F6F5F2] text-sm rounded-md hover:scale-95 transition-transform"
          >
            Create an invoice
          </Link>
          <Link
            href="/login"
            className="inline-flex px-5 py-3 border border-[#E6E4DE] text-sm rounded-md hover:scale-95 transition-transform"
          >
            Open dashboard
          </Link>
        </div>
      </section>

      <section className="px-6 py-16 border-t border-[#E6E4DE] max-w-5xl mx-auto">
        <h2 className="text-2xl font-medium mb-8">How it works</h2>
        <ol className="max-w-xl space-y-6">
          <li>
            <p className="font-medium">1. Send an invoice</p>
            <p className="text-[#6B6B6B] mt-1">Customer, amount, due date. Share the payment link.</p>
          </li>
          <li>
            <p className="font-medium">2. Customer pays VERSE</p>
            <p className="text-[#6B6B6B] mt-1">Email login and an embedded wallet. Destination is always visible.</p>
          </li>
          <li>
            <p className="font-medium">3. On-chain proof</p>
            <p className="text-[#6B6B6B] mt-1">
              Contract, recipient, amount, and confirmation are checked independently.
            </p>
          </li>
        </ol>
      </section>
    </div>
  );
}
