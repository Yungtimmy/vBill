import { PublicHeader } from "@/components/public-header";
import { Footer } from "@/components/footer";

export function PublicPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-page-gradient text-ink">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
