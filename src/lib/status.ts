export function statusLabel(status: string): string {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "PENDING":
      return "Pending";
    case "PROCESSING":
      return "Pending";
    case "PAID":
      return "Paid";
    case "UNDERPAID":
      return "Underpaid";
    case "OVERPAID":
      return "Paid";
    case "EXPIRED":
      return "Overdue";
    case "CANCELLED":
      return "Cancelled";
    case "FAILED":
      return "Failed";
    default:
      return status;
  }
}

export function statusTone(status: string): "ok" | "wait" | "bad" | "muted" {
  if (status === "PAID" || status === "OVERPAID") return "ok";
  if (status === "PENDING" || status === "PROCESSING" || status === "UNDERPAID") return "wait";
  if (status === "FAILED" || status === "EXPIRED" || status === "CANCELLED") return "bad";
  return "muted";
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
