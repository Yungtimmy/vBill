import Link from "next/link";

export function PublicFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[90vh]">
      <header className="px-6 py-5 flex justify-center">
        <Link href="/" className="font-[family-name:var(--font-syne)] tracking-tight text-lg">
          VERSEBILL
        </Link>
      </header>
      <div className="px-6 pb-16">{children}</div>
    </div>
  );
}
