import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { AmountError } from "@/lib/amounts";

export function json<T>(data: T, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export function errorResponse(err: unknown, requestId: string) {
  if (err instanceof AppError) {
    if (err.status >= 500) {
      logger.error(err.safeMessage, { requestId, code: err.code });
    }
    return NextResponse.json(
      { error: err.safeMessage, code: err.code, requestId },
      { status: err.status },
    );
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Invalid request.",
        code: "VALIDATION_ERROR",
        requestId,
        details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
      { status: 400 },
    );
  }
  if (err instanceof AmountError) {
    return NextResponse.json(
      { error: err.message, code: "INVALID_AMOUNT", requestId },
      { status: 400 },
    );
  }
  logger.error("Unhandled error", {
    requestId,
    name: err instanceof Error ? err.name : "unknown",
  });
  return NextResponse.json(
    { error: "Something went wrong.", code: "INTERNAL", requestId },
    { status: 500 },
  );
}

export function getRequestId(headers: Headers): string {
  return headers.get("x-request-id") ?? crypto.randomUUID();
}
