import { cn } from "@/lib/cn";

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  const styles = {
    primary:
      "bg-[#EEEEEF] text-[#0F0F11] hover:bg-[#C9A227] hover:text-[#0F0F11]",
    ghost: "bg-transparent text-[#EEEEEF] border border-[#2A2A2F] hover:bg-[#C9A227] hover:text-[#0F0F11] hover:border-[#C9A227]",
    danger: "bg-transparent text-[#C45C5C] border border-[#2A2A2F] hover:bg-[#C45C5C] hover:text-[#0F0F11]",
  }[variant];
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center px-5 py-3 text-sm font-medium transition-transform duration-150 hover:scale-95 active:scale-90 disabled:opacity-40 disabled:pointer-events-none",
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
        "w-full bg-[#1A1A1E] border border-[#2A2A2F] text-[#EEEEEF] px-4 py-3 outline-none focus:border-[#C9A227] placeholder:text-[#6C6C74]",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6C6C74] block mb-2">
      {children}
    </label>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs tracking-[0.2em] text-[#6C6C74] uppercase mb-6">
      {children}
    </p>
  );
}

export function StatusPill({ status }: { status: string }) {
  const color =
    status === "PAID"
      ? "text-[#6F8F72] border-[#6F8F72]"
      : status === "PROCESSING"
        ? "text-[#C9A227] border-[#C9A227]"
        : status === "FAILED" || status === "CANCELLED" || status === "EXPIRED"
          ? "text-[#C45C5C] border-[#C45C5C]"
          : "text-[#A0A0AB] border-[#2A2A2F]";
  return (
    <span className={cn("font-mono text-[10px] uppercase tracking-[0.16em] border px-2 py-1", color)}>
      {status}
    </span>
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="text-[#C45C5C] text-sm mt-2">{children}</p>;
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-[#1A1A1E] border border-[#2A2A2F] p-6", className)}>{children}</div>
  );
}
