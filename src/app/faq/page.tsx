import type { Metadata } from "next";
import { PublicPage } from "@/components/public-page";

export const metadata: Metadata = {
  title: "FAQ — VerseBill",
  description: "Common questions about VerseBill, VERSE payments, and on-chain verification.",
};

const FAQS = [
  {
    q: "What is VerseBill?",
    a: "VerseBill is an on-chain invoicing and payment application. Merchants create invoices, customers pay them with VERSE on Polygon, and VerseBill verifies each payment against the blockchain before marking the invoice paid.",
  },
  {
    q: "What is an on-chain invoice?",
    a: "An on-chain invoice is an invoice whose payment is confirmed by reading the blockchain directly. Instead of trusting a wallet popup, VerseBill checks the actual transaction data to decide whether the invoice was paid.",
  },
  {
    q: "How do customers pay an invoice?",
    a: "The merchant shares a payment link. The customer opens it, reviews the amount and recipient, connects a wallet, and signs a VERSE transfer on Polygon. VerseBill then verifies the transfer on-chain.",
  },
  {
    q: "What token does VerseBill support?",
    a: "VerseBill supports VERSE, the ecosystem token used on Polygon PoS. Invoice amounts are denominated in VERSE.",
  },
  {
    q: "What network does VerseBill use?",
    a: "Payments run on Polygon PoS (chain ID 137). Gas is paid in POL; VERSE is the asset being transferred.",
  },
  {
    q: "How does VerseBill verify payments?",
    a: "After a transaction is submitted, VerseBill reads it from the network and confirms it exists and succeeded, was sent on the expected network, used the expected VERSE contract, was sent to the merchant's assigned wallet, matched the invoice amount, and has enough confirmations.",
  },
  {
    q: "What happens if a transaction fails?",
    a: "The invoice is not marked as paid. A failed or reverted transaction leaves the invoice open so the customer can retry with a new transaction.",
  },
  {
    q: "What happens if a payment is still pending?",
    a: "The invoice stays in a processing state and VerseBill keeps checking. Once the network reports enough confirmations, the invoice is updated automatically. No payment is marked paid until verification succeeds.",
  },
  {
    q: "Can I verify a transaction myself?",
    a: "Yes. Verified payments show the transaction hash and a link to the block explorer, so anyone can confirm the transfer independently.",
  },
  {
    q: "Do I need a crypto wallet?",
    a: "Merchants need a wallet to receive payments — VerseBill creates an embedded one at sign-in. Customers need a wallet to pay; they can use an embedded wallet or an external wallet they already own.",
  },
  {
    q: "How does VerseBill protect users from incorrect payment details?",
    a: "The payment page shows the recipient address and amount before signing. VerseBill also verifies the token, recipient, amount, and network on the server side, so a transfer to the wrong address, token, or amount is never marked as a completed payment.",
  },
];

export default function FaqPage() {
  return (
    <PublicPage>
      <div className="max-w-3xl mx-auto px-5 sm:px-6 py-12 md:py-20">
        <p className="text-sm font-medium text-purple">FAQ</p>
        <h1 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight leading-tight">
          Frequently asked questions.
        </h1>

        <div className="mt-12 space-y-4">
          {FAQS.map((item) => (
            <section key={item.q} className="rounded-2xl border border-line bg-card p-5 sm:p-6">
              <h2 className="font-semibold text-ink">{item.q}</h2>
              <p className="mt-2 text-sm text-muted leading-relaxed">{item.a}</p>
            </section>
          ))}
        </div>
      </div>
    </PublicPage>
  );
}
