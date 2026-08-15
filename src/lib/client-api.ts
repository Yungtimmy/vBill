"use client";

import { getAccessToken } from "@privy-io/react-auth";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  let token: string | null = null;
  try {
    token = await getAccessToken();
  } catch {
    token = null;
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(path, { ...init, headers });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
  } & T;
  if (!res.ok) {
    throw new Error(data.error || "Request failed.");
  }
  return data;
}

export function formatError(err: unknown): string {
  return err instanceof Error ? err.message : "Request failed.";
}
