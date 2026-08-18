import type { Metadata } from "next";
import { PublicPage } from "@/components/public-page";

export const metadata: Metadata = {
  title: "Terms of Service — VerseBill",
  description: "VerseBill terms of service.",
};

export default function TermsPage() {
  return (
    <PublicPage>
      <div className="max-w-3xl mx-auto px-5 sm:px-6 py-12 md:py-20">
        <p className="text-sm font-medium text-purple">Legal</p>
        <h1 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight leading-tight">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-muted">Last updated: August 18, 2026</p>

        <div className="mt-10 space-y-8 text-base leading-relaxed text-muted">
          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">1. Acceptance of terms</h2>
            <p>
              This page is a placeholder for the VerseBill Terms of Service. It will describe the
              terms under which the application is provided and used.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">2. The service</h2>
            <p>
              This section will describe the invoicing and payment verification service, including
              what VerseBill does and does not do (for example, VerseBill does not hold funds or
              custody private keys).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">3. User responsibilities</h2>
            <p>
              This section will describe user obligations, including providing accurate invoice
              details and keeping wallet access secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">4. Payments and verification</h2>
            <p>
              This section will describe how payments are submitted and verified, and the
              circumstances in which an invoice is considered paid.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">5. Disclaimers and limitation of liability</h2>
            <p>
              This section will contain the applicable disclaimers and limitations of liability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">6. Changes and contact</h2>
            <p>
              This section will describe how these terms may change and how to contact VerseBill.
            </p>
          </section>

          <p className="pt-4 text-sm text-muted border-t border-line">
            This placeholder is not legal advice and does not describe final, binding terms. It will
            be replaced with finalized legal copy.
          </p>
        </div>
      </div>
    </PublicPage>
  );
}
