import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function BrandLogo({
  href = "/",
  size = 36,
  word = true,
}: {
  href?: string | null;
  size?: number;
  word?: boolean;
}) {
  const mark = (
    <Image
      src="/image.png"
      alt={word ? "" : "VerseBill"}
      width={size}
      height={size}
      className="rounded-xl shrink-0"
      priority
    />
  );
  const label = word ? (
    <span className="text-[15px] font-semibold tracking-tight text-ink">VerseBill</span>
  ) : null;

  const inner = (
    <span className={cn("inline-flex items-center gap-2 min-w-0")}>
      {mark}
      {label}
    </span>
  );

  if (!href) return inner;
  return (
    <Link href={href} className="inline-flex items-center gap-2 min-w-0">
      {mark}
      {label}
    </Link>
  );
}
