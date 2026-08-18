import type { Metadata } from "next";
import { PublicPage } from "@/components/public-page";

export const metadata: Metadata = {
  title: "About — VerseBill",
  description: "What VerseBill is, why it exists, and how on-chain verification makes invoicing clearer.",
};

export default function AboutPage() {
  return (
    <PublicPage>
      <div className="max-w-3xl mx-auto px-5 sm:px-6 py-12 md:py-20">
        <p className="text-sm font-medium text-purple">About</p>
        <h1 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight leading-tight">
          Simple, verifiable invoicing for the Verse ecosystem.
        </h1>

        <div className="mt-10 space-y-8 text-base leading-relaxed text-muted">
          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">What VerseBill is</h2>
            <p>
              VerseBill is an on-chain invoicing and payment application for the VERSE token on
              Polygon. A merchant creates an invoice, VerseBill turns it into a shareable payment
              link, and the customer pays with VERSE. The invoice is only marked as paid after
              VerseBill independently confirms the payment against the blockchain.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">Why it exists</h2>
            <p>
              Traditional crypto payments are difficult to track against an invoice. A merchant
              receiving many transfers has to work out whether the right token, the right amount,
              and the right recipient were actually used — and whether the transaction even
              succeeded. That manual reconciliation is slow and error-prone.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">The problem it solves</h2>
            <p>
              VerseBill removes the guesswork from accepting crypto. Every invoice carries the
              exact amount, recipient address, token, and network, and VerseBill checks those
              details against on-chain transaction data rather than trusting a wallet&apos;s
              &quot;success&quot; message or a customer&apos;s word.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">How on-chain verification helps</h2>
            <p>
              VerseBill verifies payment details against on-chain transaction data before marking
              an invoice as paid. It confirms the transaction exists and succeeded, that it was
              sent on the expected network using the expected VERSE contract, that it was sent to
              the merchant&apos;s assigned wallet, and that the amount matches the invoice. An
              invoice transitions to paid only after this server-side verification succeeds.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">Built for the Verse ecosystem</h2>
            <p>
              VerseBill is built for the Verse ecosystem, using the VERSE token on Polygon PoS.
              It is a tool for merchants and customers in that ecosystem, and it does not hold
              funds or custody private keys.
            </p>
          </section>
        </div>
      </div>
    </PublicPage>
  );
}
