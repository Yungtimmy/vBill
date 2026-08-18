import type { Metadata } from "next";
import { FileText, Link2, Search, Wallet, Send, ShieldCheck, BadgeCheck, ReceiptText } from "lucide-react";
import { PublicPage } from "@/components/public-page";

export const metadata: Metadata = {
  title: "How it works — VerseBill",
  description: "From invoice to verified payment: the complete VerseBill flow, step by step.",
};

const STEPS = [
  {
    icon: FileText,
    title: "Merchant creates an invoice",
    body: "The merchant enters the customer, line items, and amount, then publishes the invoice.",
  },
  {
    icon: Link2,
    title: "VerseBill generates a payment request",
    body: "VerseBill creates a unique, non-guessable payment link that the merchant can share.",
  },
  {
    icon: Search,
    title: "Customer reviews the payment details",
    body: "The customer sees the amount, merchant, network, and recipient address before paying.",
  },
  {
    icon: Wallet,
    title: "Customer connects and signs",
    body: "The customer connects a wallet (embedded or external) and signs the VERSE transfer.",
  },
  {
    icon: Send,
    title: "Transaction is submitted on Polygon",
    body: "The transfer is broadcast to Polygon PoS, the network VerseBill payments run on.",
  },
  {
    icon: ShieldCheck,
    title: "VerseBill verifies the transaction on-chain",
    body: "The backend confirms the transaction exists, succeeded, and matches the invoice's token, recipient, and amount.",
  },
  {
    icon: BadgeCheck,
    title: "Invoice is marked as paid",
    body: "Only after successful verification does the invoice transition to paid.",
  },
  {
    icon: ReceiptText,
    title: "Merchant receives a verifiable payment record",
    body: "The merchant gets a permanent on-chain proof with the transaction hash and explorer link.",
  },
];

export default function HowItWorksPage() {
  return (
    <PublicPage>
      <div className="max-w-3xl mx-auto px-5 sm:px-6 py-12 md:py-20">
        <p className="text-sm font-medium text-purple">How it works</p>
        <h1 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight leading-tight">
          From invoice to verified payment.
        </h1>
        <p className="mt-5 text-muted text-base md:text-lg leading-relaxed">
          VerseBill turns an invoice into a payment link, and then proves the payment happened.
          No spreadsheets, no guessing whether a transfer cleared.
        </p>

        <ol className="mt-12 space-y-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="flex gap-4 rounded-2xl border border-line bg-card p-5 sm:p-6"
            >
              <div className="shrink-0 flex flex-col items-center">
                <span className="h-10 w-10 rounded-xl bg-lavender text-purple flex items-center justify-center">
                  <step.icon size={20} aria-hidden />
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-purple">Step {i + 1}</p>
                <h2 className="mt-1 font-semibold text-ink">{step.title}</h2>
                <p className="mt-1.5 text-sm text-muted leading-relaxed">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </PublicPage>
  );
}
