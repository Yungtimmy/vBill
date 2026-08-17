import { cn } from "@/lib/cn";
import { statusLabel, statusTone } from "@/lib/status";

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  const styles = {
    primary: "bg-[#6D35F2] text-white hover:bg-[#5B28D9] shadow-[0_8px_20px_-10px_rgba(109,53,242,0.7)]",
    ghost: "bg-white text-[#17151F] border border-[#E9E4F2] hover:bg-[#F4F0FF]",
    danger: "bg-white text-[#EF4444] border border-[#E9E4F2] hover:bg-[#FEF2F2]",
  }[variant];
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center px-5 py-3.5 text-sm font-semibold rounded-2xl transition-transform duration-150 hover:scale-95 active:scale-90 disabled:opacity-40 disabled:pointer-events-none",
        styles,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full bg-white border border-[#E9E4F2] text-[#17151F] px-4 py-3.5 rounded-2xl outline-none focus:border-[#6D35F2] placeholder:text-[#747180]",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-[#747180] block mb-2">{children}</label>;
}

export function StatusPill({ status }: { status: string }) {
  const tone = statusTone(status);
  const color = {
    ok: "text-[#16A866] bg-[#E8F8F0]",
    wait: "text-[#B45309] bg-[#FEF3C7]",
    bad: "text-[#EF4444] bg-[#FEE2E2]",
    muted: "text-[#6D35F2] bg-[#F4F0FF]",
  }[tone];
  return (
    <span className={cn("inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full", color)}>
      {tone === "ok" ? `✓ ${statusLabel(status)}` : statusLabel(status)}
    </span>
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="text-[#EF4444] text-sm mt-2">{children}</p>;
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-white border border-[#E9E4F2] rounded-[22px] p-5 shadow-[0_8px_24px_-18px_rgba(23,21,31,0.18)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Check({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-sm text-[#16A866]">
      <span aria-hidden>✓</span>
      <span className="text-[#17151F]">{children}</span>
    </p>
  );
}
