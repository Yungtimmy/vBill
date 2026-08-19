import { cn } from "@/lib/cn";
import { FeatureImage } from "@/components/feature-image";

/**
 * Landing-page feature guide. Large editorial cards with oversized type,
 * generous whitespace, and static visuals. No decorative animation (per the
 * VerseBill motion rules); the only movement allowed is functional feedback.
 *
 * Cards 1 & 2 use reference images that the owner drops into public/images/.
 * Cards 3–5 use code-drawn visuals so they render without any assets.
 */

function VerifiedOnChainVisual() {
  return (
    <svg
      viewBox="0 0 720 180"
      className="w-full"
      role="img"
      aria-label="An invoice flows to a Polygon transaction, which is verified on-chain before the payment is confirmed"
    >
      <defs>
        <linearGradient id="fg-brand" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#168bff" />
          <stop offset="50%" stopColor="#6d35f2" />
          <stop offset="100%" stopColor="#d500f9" />
        </linearGradient>
      </defs>

      {/* Invoice */}
      <rect x={20} y={60} width={190} height={72} rx={16} fill="var(--card)" stroke="var(--line)" strokeWidth={1.5} />
      <text x={115} y={92} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--ink)">
        Invoice
      </text>
      <text x={115} y={114} textAnchor="middle" fontSize={12} fill="var(--muted)">
        Clear payment details
      </text>

      {/* Arrow 1 */}
      <line x1={210} y1={96} x2={244} y2={96} stroke="var(--muted)" strokeWidth={1.5} />
      <path d="M 244 90 L 256 96 L 244 102 Z" fill="var(--muted)" />

      {/* Polygon transaction */}
      <rect x={260} y={60} width={190} height={72} rx={16} fill="var(--card)" stroke="var(--line)" strokeWidth={1.5} />
      <text x={355} y={92} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--ink)">
        Polygon transaction
      </text>
      <text x={355} y={114} textAnchor="middle" fontSize={12} fill="var(--muted)">
        Submitted on-chain
      </text>

      {/* Arrow 2 */}
      <line x1={450} y1={96} x2={484} y2={96} stroke="var(--muted)" strokeWidth={1.5} />
      <path d="M 484 90 L 496 96 L 484 102 Z" fill="var(--muted)" />

      {/* Verified payment */}
      <rect x={500} y={60} width={200} height={72} rx={16} fill="var(--card)" stroke="url(#fg-brand)" strokeWidth={2} />
      <circle cx={600} cy={80} r={11} fill="#16a866" />
      <path
        d="M 594.5 80 L 598.5 84 L 606 75.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x={600} y={106} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--ink)">
        Verified payment
      </text>
      <text x={600} y={127} textAnchor="middle" fontSize={12} fill="var(--muted)">
        Confirmed on-chain
      </text>
    </svg>
  );
}

function PaidRecordVisual() {
  return (
    <div aria-hidden="true" className="rounded-2xl border border-line bg-bg p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-success bg-success-soft px-2.5 py-1 rounded-full">
          ✓ Paid
        </span>
        <span className="text-xs text-muted font-mono">VB-1002</span>
      </div>
      <p className="mt-6 text-[36px] sm:text-[44px] font-bold tracking-tight leading-none">
        500 <span className="text-xl font-semibold text-muted">VERSE</span>
      </p>
      <p className="mt-2 text-sm text-muted">Verified on Polygon</p>
      <div className="mt-6 pt-4 border-t border-line">
        <p className="text-xs text-muted">Transaction</p>
        <p className="mt-1 text-sm font-mono">0x82…A91F</p>
      </div>
    </div>
  );
}

function MerchantVisual() {
  const stats = [
    { label: "Total invoiced", value: "1,240 VERSE" },
    { label: "Paid", value: "980 VERSE" },
    { label: "Pending", value: "3" },
    { label: "Overdue", value: "1" },
  ];
  return (
    <div aria-hidden="true" className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl border border-line bg-bg p-4 sm:p-5">
          <p className="text-xs sm:text-sm text-muted">{s.label}</p>
          <p className="mt-2 text-lg sm:text-2xl font-bold tracking-tight">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

export function FeatureGuideCard({
  headline,
  description,
  visual,
  compact = false,
}: {
  headline: string;
  description: string;
  visual: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col bg-card border border-line rounded-[28px] p-6 sm:p-10 md:p-12 shadow-[0_8px_24px_-18px_rgba(23,21,31,0.18)]">
      <h3
        className={cn(
          "font-bold tracking-tight leading-[1.08] max-w-3xl",
          compact
            ? "text-[32px] sm:text-[36px] lg:text-[40px]"
            : "text-[32px] sm:text-[40px] md:text-[48px] lg:text-[56px]",
        )}
      >
        {headline}
      </h3>
      <p className="mt-4 md:mt-5 text-lg md:text-xl text-muted max-w-2xl leading-relaxed">
        {description}
      </p>
      <div className="mt-auto pt-10 md:pt-14">{visual}</div>
    </div>
  );
}

export function FeatureGuideSection() {
  return (
    <section className="px-5 sm:px-6 py-20 md:py-28 max-w-[1200px] mx-auto">
      <div className="max-w-3xl mb-10 md:mb-16">
        <h2 className="text-[32px] sm:text-[40px] md:text-[48px] lg:text-[56px] font-bold tracking-tight leading-[1.08]">
          Built for payments that can be verified.
        </h2>
        <p className="mt-4 text-lg md:text-xl text-muted leading-relaxed">
          Every payment is checked against the blockchain before an invoice is marked paid.
        </p>
      </div>

      <div className="space-y-6 md:space-y-8">
        <FeatureGuideCard
          headline="Invoice with confidence"
          description="Create clear, professional invoices with payment details your customers can review before sending funds."
          visual={
            <FeatureImage
              src="/images/invoice-confidence.png"
              alt="A VerseBill invoice with clear payment details"
            />
          }
        />

        <FeatureGuideCard
          headline="Pay your way"
          description="Give customers a simple way to pay on-chain while keeping the payment details transparent and easy to understand."
          visual={
            <FeatureImage
              src="/images/pay-your-way.png"
              alt="A customer reviewing and paying a VerseBill invoice"
            />
          }
        />

        <div className="grid gap-6 md:gap-8 md:grid-cols-2">
          <FeatureGuideCard
            compact
            headline="Verified on-chain"
            description="Payments aren't marked complete just because a wallet says they were sent. VerseBill verifies the transaction against on-chain data before confirming payment."
            visual={<VerifiedOnChainVisual />}
          />
          <FeatureGuideCard
            compact
            headline="Know when you're paid"
            description="Track invoice status from created to paid with a clear payment history and verifiable transaction records."
            visual={<PaidRecordVisual />}
          />
        </div>

        <FeatureGuideCard
          headline="Built for merchants"
          description="Create invoices, share payment requests and keep your payment records organized from one simple workspace."
          visual={<MerchantVisual />}
        />
      </div>
    </section>
  );
}
