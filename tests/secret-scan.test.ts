import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const SKIP = new Set(["node_modules", ".git", ".next", "coverage", "tmp"]);

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx|js|mjs|md|json|yml|yaml|example)$/.test(name)) acc.push(full);
  }
  return acc;
}

describe("secret scanning", () => {
  it("does not commit Privy app secrets", () => {
    const hits: string[] = [];
    for (const file of walk(ROOT)) {
      const text = readFileSync(file, "utf8");
      if (/privy_app_secret_[A-Za-z0-9]{16,}/.test(text)) {
        hits.push(file);
      }
    }
    expect(hits).toEqual([]);
  });
});
