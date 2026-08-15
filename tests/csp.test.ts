import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy, isPublicPath } from "@/lib/security-headers";

describe("Privy CSP", () => {
  const prod = buildContentSecurityPolicy({ nonce: "testnonce", isDev: false });
  const dev = buildContentSecurityPolicy({ nonce: "testnonce", isDev: true });

  it("includes the official Privy and WalletConnect sources", () => {
    expect(prod).toContain("https://auth.privy.io");
    expect(prod).toContain("https://verify.walletconnect.com");
    expect(prod).toContain("https://verify.walletconnect.org");
    expect(prod).toContain("https://challenges.cloudflare.com");
    expect(prod).toContain("wss://relay.walletconnect.com");
    expect(prod).toContain("wss://www.walletlink.org");
    expect(prod).toContain("https://*.rpc.privy.systems");
    expect(prod).toContain("https://explorer-api.walletconnect.com");
    expect(prod).toContain("frame-ancestors 'none'");
    expect(prod).toContain("object-src 'none'");
  });

  it("uses a nonce instead of unsafe-inline scripts", () => {
    expect(prod).toContain("nonce-testnonce");
    expect(prod).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(prod).not.toContain("unsafe-eval");
    expect(prod).not.toContain("strict-dynamic");
  });

  it("allows unsafe-eval only in development", () => {
    expect(dev).toContain("unsafe-eval");
    expect(prod).not.toContain("unsafe-eval");
  });

  it("does not open connect-src or CORS to the world", () => {
    expect(prod).not.toContain("connect-src *");
    expect(prod).not.toContain("Access-Control-Allow-Origin");
    expect(prod).not.toContain("polygon-rpc.com");
  });

  it("keeps public pay and verify routes outside auth redirects", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/pay/abc")).toBe(true);
    expect(isPublicPath("/verify/abc")).toBe(true);
    expect(isPublicPath("/refresh")).toBe(true);
    expect(isPublicPath("/dashboard")).toBe(false);
    expect(isPublicPath("/settings/wallet")).toBe(false);
  });
});
