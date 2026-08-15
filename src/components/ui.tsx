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
    primary: "bg-[#0C7A4D] text-[#F6F5F2] hover:bg-[#09653f]",
    ghost: "bg-transparent text-[#161616] border border-[#E6E4DE] hover:bg-[#161616] hover:text-[#F6F5F2]",
    danger: "bg-transparent text-[#C23B3B] border border-[#E6E4DE] hover:bg-[#C23B3B] hover:text-[#F6F5F2]",
  }[variant];
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center px-5 py-3 text-sm font-medium rounded-md transition-transform duration-150 hover:scale-95 active:scale-90 disabled:opacity-40 disabled:pointer-events-none",
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
        "w-full bg-white border border-[#E6E4DE] text-[#161616] px-4 py-3 rounded-md outline-none focus:border-[#0C7A4D] placeholder:text-[#8A8A8A]",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-medium text-[#6B6B6B] block mb-2">{children}</label>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone = statusTone(status);
  const color = {
    ok: "text-[#0C7A4D] bg-[#E7F5EE]",
    wait: "text-[#C4841D] bg-[#F8EFD9]",
    bad: "text-[#C23B3B] bg-[#F8E4E4]",
    muted: "text-[#6B6B6B] bg-[#EFEDE8]",
  }[tone];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full", color)}>
      {tone === "ok" ? `${statusLabel(status)}` : statusLabel(status)}
    </span>
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="text-[#C23B3B] text-sm mt-2">{children}</p>;
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-white border border-[#E6E4DE] rounded-xl p-6", className)}>{children}</div>
  );
}

export function Check({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-sm text-[#0C7A4D]">
      <span aria-hidden>✓</span>
      <span>{children}</span>
    </p>
  );
}
