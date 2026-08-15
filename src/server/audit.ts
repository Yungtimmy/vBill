import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function writeAudit(input: {
  userId?: string | null;
  invoiceId?: string | null;
  event: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        invoiceId: input.invoiceId ?? null,
        event: input.event,
        metadata: input.metadata
          ? JSON.parse(JSON.stringify(input.metadata))
          : undefined,
      },
    });
  } catch {
    logger.error("audit_write_failed", { event: input.event });
  }
}
