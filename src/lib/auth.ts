import { PrivyClient } from "@privy-io/node";
import type { User, Merchant, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ConfigurationError, ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { normalizeAddress } from "@/lib/addresses";
import { assertMerchantOwns } from "@/lib/authz";

export { assertMerchantOwns };

export type Session = {
  privyUserId: string;
  user: User;
  merchant: Merchant;
};

let privy: PrivyClient | null = null;

function normalizePem(raw: string): string {
  return raw.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");
}

function getPrivy(): PrivyClient {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const secret = process.env.PRIVY_APP_SECRET;
  if (!appId || !secret) {
    throw new ConfigurationError("Privy is not configured.");
  }
  if (!privy) {
    const verificationKey = process.env.PRIVY_VERIFICATION_KEY
      ? normalizePem(process.env.PRIVY_VERIFICATION_KEY)
      : undefined;
    privy = new PrivyClient({
      appId,
      appSecret: secret,
      ...(verificationKey ? { jwtVerificationKey: verificationKey } : {}),
    });
  }
  return privy;
}

export function extractBearer(headers: Headers): string | null {
  const raw = headers.get("authorization");
  if (!raw) return null;
  const match = /^Bearer\s+(.+)$/i.exec(raw.trim());
  return match?.[1]?.trim() || null;
}

export function extractCookieToken(headers: Headers): string | null {
  const cookie = headers.get("cookie");
  if (!cookie) return null;
  const match = /(?:^|;\s*)privy-token=([^;]+)/.exec(cookie);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function extractAccessToken(headers: Headers): string | null {
  return extractBearer(headers) ?? extractCookieToken(headers);
}

export { normalizePem };

export async function verifyAccessToken(token: string): Promise<{
  userId: string;
  issuedAt?: number;
}> {
  try {
    const claims = await getPrivy().utils().auth().verifyAccessToken(token);
    if (!claims.user_id) {
      throw new UnauthorizedError("Invalid authentication.");
    }
    return {
      userId: claims.user_id,
      issuedAt: claims.issued_at,
    };
  } catch {
    throw new UnauthorizedError("Invalid authentication.");
  }
}

export async function requireSession(headers: Headers): Promise<Session & { issuedAt?: number }> {
  const token = extractAccessToken(headers);
  if (!token) {
    throw new UnauthorizedError();
  }
  const { userId, issuedAt } = await verifyAccessToken(token);
  const user = await prisma.user.findUnique({
    where: { privyUserId: userId },
    include: { merchant: true },
  });
  if (!user || !user.merchant) {
    throw new UnauthorizedError("Account is not provisioned.");
  }
  return { privyUserId: userId, user, merchant: user.merchant, issuedAt };
}

export async function requireRole(headers: Headers, role: Role): Promise<Session> {
  const session = await requireSession(headers);
  if (session.user.role !== role) {
    throw new ForbiddenError();
  }
  return session;
}

export async function upsertUserFromPrivy(input: {
  privyUserId: string;
  email?: string | null;
  walletAddress?: string | null;
  businessName?: string | null;
}): Promise<Session> {
  const wallet = input.walletAddress ? normalizeAddress(input.walletAddress) : null;

  const user = await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({
      where: { privyUserId: input.privyUserId },
      include: { merchant: true },
    });

    if (existing?.merchant) {
      const updated = await tx.user.update({
        where: { id: existing.id },
        data: {
          email: input.email ?? existing.email,
          walletAddress: wallet ?? existing.walletAddress,
        },
        include: { merchant: true },
      });
      if (wallet && !existing.merchant.walletAddress) {
        await tx.merchant.update({
          where: { id: existing.merchant.id },
          data: { walletAddress: wallet },
        });
      }
      return tx.user.findUniqueOrThrow({
        where: { id: updated.id },
        include: { merchant: true },
      });
    }

    if (!wallet) {
      throw new UnauthorizedError("An embedded wallet is required before continuing.");
    }

    return tx.user.create({
      data: {
        privyUserId: input.privyUserId,
        email: input.email ?? null,
        walletAddress: wallet,
        merchant: {
          create: {
            businessName: input.businessName?.trim() || "",
            businessEmail: input.email ?? null,
            walletAddress: wallet,
          },
        },
      },
      include: { merchant: true },
    });
  });

  if (!user.merchant) {
    throw new UnauthorizedError("Account is not provisioned.");
  }

  return { privyUserId: input.privyUserId, user, merchant: user.merchant };
}


