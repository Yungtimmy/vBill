export function nowUtc(): Date {
  return new Date();
}

export function isExpired(dueDate: Date | null | undefined, at: Date = nowUtc()): boolean {
  if (!dueDate) return false;
  return dueDate.getTime() < at.getTime();
}

export function secondsSince(unixSeconds: number, at: Date = nowUtc()): number {
  return Math.floor(at.getTime() / 1000) - unixSeconds;
}
