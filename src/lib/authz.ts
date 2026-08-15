import { ForbiddenError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export function assertMerchantOwns(merchantId: string, resourceMerchantId: string): void {
  if (merchantId !== resourceMerchantId) {
    logger.warn("authorization_denied", { reason: "ownership" });
    throw new ForbiddenError();
  }
}

export function isFreshAuth(issuedAt: number | undefined, maxAgeSeconds: number): boolean {
  if (issuedAt == null) return false;
  const age = Math.floor(Date.now() / 1000) - issuedAt;
  return age >= 0 && age <= maxAgeSeconds;
}
