import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";

const memory = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<void> {
  const now = Date.now();
  const mem = memory.get(input.key);
  if (!mem || mem.resetAt < now) {
    memory.set(input.key, { count: 1, resetAt: now + input.windowMs });
  } else {
    mem.count += 1;
    if (mem.count > input.limit * 4) {
      throw new AppError("RATE_LIMITED", "Too many requests. Try again shortly.", 429);
    }
  }

  const windowStart = new Date(now - input.windowMs);
  try {
    const recent = await prisma.rateLimitHit.count({
      where: { key: input.key, createdAt: { gt: windowStart } },
    });
    if (recent >= input.limit) {
      throw new AppError("RATE_LIMITED", "Too many requests. Try again shortly.", 429);
    }
    await prisma.rateLimitHit.create({ data: { key: input.key } });
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (mem && mem.count > input.limit) {
      throw new AppError("RATE_LIMITED", "Too many requests. Try again shortly.", 429);
    }
  }
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
