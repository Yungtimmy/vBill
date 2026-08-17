import { BrandLogo } from "@/components/brand-logo";

export function PublicFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100vh] bg-[linear-gradient(180deg,#F4F0FF_0%,#FAF9FF_42%,#FFFFFF_100%)]">
      <header className="px-5 py-6 flex justify-center">
        <BrandLogo href="/" size={40} />
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
      className={`bg-white border border-[#E9E4F2] rounded-[28px] p-6 sm:p-8 shadow-[0_16px_40px_-24px_rgba(23,21,31,0.18)] ${className}`}
    >
      {children}
    </div>
  );
}
