import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    // Payment confirmation locks rows and runs several queries inside one
    // transaction; the default 5s interactive timeout is too tight against
    // the Supabase pooler and aborts commits, leaving payments PROCESSING.
    transactionOptions: {
      maxWait: 20_000,
      timeout: 20_000,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
