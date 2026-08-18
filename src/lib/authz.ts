import { ForbiddenError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export function assertMerchantOwns(merchantId: string, resourceMerchantId: string): void {
  if (merchantId !== resourceMerchantId) {
    logger.warn("authorization_denied", { reason: "ownership" });
    throw new ForbiddenError();
  }
}
