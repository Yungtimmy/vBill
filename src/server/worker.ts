import { prisma } from "@/lib/db";
import { verifyPayment } from "@/server/verify-payment";
import { logger } from "@/lib/logger";

export async function processPendingPayments(limit = 25): Promise<{ processed: number }> {
  const pending = await prisma.payment.findMany({
    where: { status: "PROCESSING" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let processed = 0;
  for (const payment of pending) {
    try {
      await verifyPayment(payment.id);
      processed += 1;
    } catch (err) {
      logger.warn("worker_verify_deferred", {
        paymentId: payment.id,
        reason: err instanceof Error ? err.name : "unknown",
      });
    }
  }
  return { processed };
}
