import type { Metadata } from "next";
import { PublicPage } from "@/components/public-page";

export const metadata: Metadata = {
  title: "Privacy Policy — VerseBill",
  description: "VerseBill privacy policy.",
};

export default function PrivacyPage() {
  return (
    <PublicPage>
      <div className="max-w-3xl mx-auto px-5 sm:px-6 py-12 md:py-20">
        <p className="text-sm font-medium text-purple">Legal</p>
        <h1 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight leading-tight">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-muted">Last updated: August 18, 2026</p>

        <div className="mt-10 space-y-8 text-base leading-relaxed text-muted">
          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">1. Overview</h2>
            <p>
              This page is a placeholder for the VerseBill Privacy Policy. It will describe what
              information VerseBill collects, how it is used, and the choices available to users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">2. Information we process</h2>
            <p>
              This section will list the categories of information the application processes, such
              as account details, invoice data, and public blockchain transaction data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">3. How information is used</h2>
            <p>
              This section will explain how processed information is used to provide invoicing and
              payment verification, and the lawful bases for that processing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">4. Data retention and security</h2>
            <p>
              This section will describe retention periods and the technical and organizational
              measures used to protect information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">5. Your rights</h2>
            <p>
              This section will describe the rights available to users regarding their information
              and how to exercise them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">6. Contact</h2>
            <p>
              This section will provide a contact method for privacy questions and requests.
            </p>
          </section>

          <p className="pt-4 text-sm text-muted border-t border-line">
            This placeholder is not legal advice and does not describe final, binding policy terms.
            It will be replaced with finalized legal copy.
          </p>
        </div>
      </div>
    </PublicPage>
  );
}
