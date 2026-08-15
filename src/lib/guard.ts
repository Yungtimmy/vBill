import { originAllowed } from "@/lib/origin";
import { AppError } from "@/lib/errors";

export function assertSafeMutation(headers: Headers): void {
  if (!originAllowed(headers)) {
    throw new AppError("FORBIDDEN_ORIGIN", "Request origin is not allowed.", 403);
  }
}
