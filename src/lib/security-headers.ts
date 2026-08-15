export type CspOptions = {
  nonce: string;
  isDev: boolean;
};

/**
 * CSP built from Privy's official implementation guide, plus a per-request
 * nonce so Next.js inline runtime scripts can run without 'unsafe-inline'.
 * https://docs.privy.io/security/implementation-guide/content-security-policy
 *
 * Do not add 'strict-dynamic': it disables host allowlists and would block
 * Cloudflare Turnstile (https://challenges.cloudflare.com).
 */
export function buildContentSecurityPolicy({ nonce, isDev }: CspOptions): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "https://challenges.cloudflare.com",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(" ");

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "child-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org",
    "frame-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org https://challenges.cloudflare.com",
    "connect-src 'self' https://auth.privy.io wss://relay.walletconnect.com wss://relay.walletconnect.org wss://www.walletlink.org https://*.rpc.privy.systems https://explorer-api.walletconnect.com",
    "worker-src 'self'",
    "manifest-src 'self'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ];

  return directives.join("; ");
}

export function staticSecurityHeaders(isDev: boolean): Array<{ key: string; value: string }> {
  const headers = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=()",
    },
    { key: "X-DNS-Prefetch-Control", value: "off" },
  ];
  if (!isDev) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }
  return headers;
}

export const PRIVY_COOKIE_TOKEN = "privy-token";
export const PRIVY_COOKIE_SESSION = "privy-session";

export function isPublicPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/login" || pathname === "/refresh") return true;
  if (pathname.startsWith("/pay/")) return true;
  if (pathname.startsWith("/verify/")) return true;
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/opengraph-image")) return true;
  if (pathname === "/robots.txt" || pathname === "/favicon.ico") return true;
  return false;
}
