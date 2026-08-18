"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be unavailable in non-https contexts; the code is still visible.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="text-xs font-medium text-muted hover:text-ink px-2 py-1 rounded-md"
      aria-label="Copy to clipboard"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
