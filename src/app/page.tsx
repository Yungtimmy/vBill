import Link from "next/link";
import { PublicPage } from "@/components/public-page";

export default function HomePage() {
  return (
    <PublicPage>
      <section className="px-5 pt-10 pb-20 max-w-[1200px] mx-auto">
        <p className="text-sm font-medium text-purple">Invoices that prove payment</p>
        <h1 className="mt-3 text-[32px] md:text-5xl font-bold tracking-tight max-w-2xl leading-[1.15]">
          Get paid in VERSE. Verify it on-chain.
        </h1>
        <p className="text-muted text-base md:text-lg mt-5 max-w-xl leading-relaxed">
          Create an invoice, share a link, and accept VERSE on Polygon. VerseBill checks the
          blockchain before anything is marked paid.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/login"
            className="inline-flex justify-center px-5 py-3.5 bg-purple text-white text-sm font-semibold rounded-2xl hover:bg-[#5B28D9]"
          >
            Create an invoice
          </Link>
          <Link
            href="/docs"
            className="inline-flex justify-center px-5 py-3.5 bg-card border border-line text-sm font-semibold rounded-2xl hover:bg-lavender"
          >
            Read Documentation →
          </Link>
        </div>
      </section>

      <section className="px-5 pb-24 max-w-[1200px] mx-auto">
        <p className="text-sm font-medium text-muted mb-6">How it works</p>
        <ol className="max-w-xl space-y-6">
          <li>
            <p className="font-semibold">1. Send an invoice</p>
            <p className="text-muted mt-1 text-sm">Customer, amount, due date. Share the payment link.</p>
          </li>
          <li>
            <p className="font-semibold">2. Customer pays VERSE</p>
            <p className="text-muted mt-1 text-sm">The recipient address stays visible before they sign.</p>
          </li>
          <li>
            <p className="font-semibold">3. Payment verified on-chain</p>
            <p className="text-muted mt-1 text-sm">
              Network, token, recipient, amount, and confirmation are checked independently.
            </p>
          </li>
        </ol>
        <Link href="/how-it-works" className="inline-flex mt-8 text-sm font-medium text-purple hover:underline">
          See the full flow →
        </Link>
      </section>
    </PublicPage>
  );
}
