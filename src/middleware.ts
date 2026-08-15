import { NextRequest, NextResponse } from "next/server";
import {
  PRIVY_COOKIE_SESSION,
  PRIVY_COOKIE_TOKEN,
  buildContentSecurityPolicy,
  isPublicPath,
  staticSecurityHeaders,
} from "@/lib/security-headers";

export function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildContentSecurityPolicy({ nonce, isDev });

  const oauthInProgress =
    request.nextUrl.searchParams.has("privy_oauth_code") ||
    request.nextUrl.searchParams.has("privy_oauth_state") ||
    request.nextUrl.searchParams.has("privy_oauth_provider");

  if (!oauthInProgress && !isPublicPath(request.nextUrl.pathname)) {
    const access = request.cookies.get(PRIVY_COOKIE_TOKEN);
    const session = request.cookies.get(PRIVY_COOKIE_SESSION);
    if (!access && session) {
      const refresh = new URL("/refresh", request.url);
      refresh.searchParams.set("redirect_uri", request.nextUrl.pathname + request.nextUrl.search);
      return applyHeaders(NextResponse.redirect(refresh), csp, nonce, isDev);
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  return applyHeaders(response, csp, nonce, isDev);
}

function applyHeaders(
  response: NextResponse,
  csp: string,
  nonce: string,
  isDev: boolean,
): NextResponse {
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("x-nonce", nonce);
  for (const header of staticSecurityHeaders(isDev)) {
    response.headers.set(header.key, header.value);
  }
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
