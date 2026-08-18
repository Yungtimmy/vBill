import Link from "next/link";
import { PublicPage } from "@/components/public-page";

const CARDS = [
  {
    title: "Getting Started",
    description: "Understand the product and payment flow.",
    href: "/docs/introduction",
  },
  {
    title: "Architecture",
    description: "Understand how the frontend, backend, database and blockchain interact.",
    href: "/docs/architecture",
  },
  {
    title: "Payments",
    description: "Understand how invoice payments are created and verified.",
    href: "/docs/payments",
  },
  {
    title: "Security",
    description: "Understand how VerseBill protects payment workflows.",
    href: "/docs/security-model",
  },
  {
    title: "Verse Integration",
    description: "Understand how VerseBill integrates with the Verse ecosystem.",
    href: "/docs/verse-integration",
  },
];

export default function DocsPage() {
  return (
    <PublicPage>
      <section className="px-5 pt-12 pb-16 max-w-[1200px] mx-auto">
        <p className="text-sm font-medium text-purple">Documentation</p>
        <h1 className="mt-3 text-[32px] md:text-5xl font-bold tracking-tight max-w-2xl leading-[1.15]">
          VerseBill Documentation
        </h1>
        <p className="text-muted text-base md:text-lg mt-4 max-w-xl leading-relaxed">
          Everything you need to understand how VerseBill works.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-[22px] border border-line bg-card p-5 hover:border-purple"
            >
              <p className="font-semibold text-ink">{card.title}</p>
              <p className="mt-2 text-sm text-muted leading-relaxed">{card.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </PublicPage>
  );
}
