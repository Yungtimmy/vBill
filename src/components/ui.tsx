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
    primary: "bg-purple text-white hover:bg-[#5B28D9] shadow-[0_8px_20px_-10px_rgba(109,53,242,0.7)]",
    ghost: "bg-card text-ink border border-line hover:bg-lavender",
    danger: "bg-card text-error border border-line hover:bg-error-soft",
  }[variant];
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center px-5 py-3.5 text-sm font-semibold rounded-2xl transition-colors duration-100 active:opacity-90 disabled:opacity-40 disabled:pointer-events-none",
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
        "w-full bg-card border border-line text-ink px-4 py-3.5 rounded-2xl outline-none focus:border-purple placeholder:text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-muted block mb-2">{children}</label>;
}

export function StatusPill({ status }: { status: string }) {
  const tone = statusTone(status);
  const color = {
    ok: "text-success bg-success-soft",
    wait: "text-warning bg-warning-soft",
    bad: "text-error bg-error-soft",
    muted: "text-purple bg-lavender",
  }[tone];
  return (
    <span className={cn("inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full", color)}>
      {tone === "ok" ? `✓ ${statusLabel(status)}` : statusLabel(status)}
    </span>
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="text-error text-sm mt-2">{children}</p>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-xl bg-line", className)} aria-hidden />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin",
        className,
      )}
      aria-hidden
    />
  );
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
        "bg-card border border-line rounded-[22px] p-5 shadow-[0_8px_24px_-18px_rgba(23,21,31,0.18)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Check({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-sm text-success">
      <span aria-hidden>✓</span>
      <span className="text-ink">{children}</span>
    </p>
  );
}
