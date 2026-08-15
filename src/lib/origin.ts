export function allowedOrigins(): string[] {
  const extra = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const app = process.env.APP_URL?.replace(/\/$/, "");
  const set = new Set<string>(extra);
  if (app) set.add(app);
  return [...set];
}

export function originAllowed(headers: Headers): boolean {
  const allow = allowedOrigins();
  if (allow.length === 0) {
    return true;
  }
  const origin = headers.get("origin");
  if (!origin) {
    return true;
  }
  return allow.includes(origin.replace(/\/$/, ""));
}
