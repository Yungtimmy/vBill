/**
 * Static brand accent text. No hover glow or animation — the VerseBill brand
 * gradient and wordmarks are intentionally static per the motion rules.
 */
export function GlowWord({
  children,
  color = "#C9A227",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return <span style={{ color }}>{children}</span>;
}
