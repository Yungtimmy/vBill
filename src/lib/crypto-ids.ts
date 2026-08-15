import { randomBytes } from "crypto";

export function newPublicId(): string {
  return randomBytes(18).toString("hex");
}

export function newRequestId(): string {
  return randomBytes(12).toString("hex");
}

export function formatInvoiceNumber(seq: number): string {
  if (!Number.isInteger(seq) || seq < 1) {
    throw new Error("Invalid invoice sequence");
  }
  return `VB-${1000 + seq}`;
}
