/**
 * Shared external links. Kept here so the footer, docs, and landing page all
 * point at the same destinations and no URL is hardcoded in multiple places.
 *
 * X is intentionally optional: the official VerseBill X profile has not been
 * supplied yet, so the footer hides the X link until NEXT_PUBLIC_X_URL is set.
 */
export const VERSE_ECOSYSTEM_URL = "https://verse.bitcoin.com";

export function xUrl(): string | null {
  const raw = (process.env.NEXT_PUBLIC_X_URL ?? "").trim();
  return raw.length > 0 ? raw : null;
}
