import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function PublicFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100vh] bg-page-gradient">
      <header className="px-5 py-6 max-w-[1200px] mx-auto flex items-center justify-between gap-4">
        <BrandLogo href="/" size={40} />
        <ThemeToggle />
      </header>
      <div className="px-4 sm:px-6 pb-16">{children}</div>
    </div>
  );
}

export function PayCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-card border border-line rounded-[28px] p-6 sm:p-8 shadow-[0_16px_40px_-24px_rgba(23,21,31,0.18)] ${className}`}
    >
      {children}
    </div>
  );
}
