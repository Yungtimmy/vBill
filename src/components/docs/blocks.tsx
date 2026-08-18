import type { Block } from "@/content/docs";
import { CopyButton } from "@/components/docs/copy-button";

function CodeBlock({ lang, title, code }: { lang?: string; title?: string; code: string }) {
  return (
    <div className="rounded-2xl border border-line bg-lavender overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-line">
        <span className="text-xs font-medium text-muted">{title ?? lang ?? "code"}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed text-ink">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return (
              <h2 key={i} className="text-xl font-semibold tracking-tight pt-2">
                {b.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="text-base font-semibold tracking-tight pt-1">
                {b.text}
              </h3>
            );
          case "p":
            return (
              <p key={i} className="text-[15px] leading-relaxed text-muted">
                {b.text}
              </p>
            );
          case "list":
            return (
              <ul key={i} className="space-y-2 text-[15px] leading-relaxed text-muted">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2">
                    <span aria-hidden className="text-purple shrink-0">
                      •
                    </span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            );
          case "steps":
            return (
              <ol key={i} className="space-y-2">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-3 text-[15px] leading-relaxed text-muted">
                    <span className="shrink-0 h-6 w-6 rounded-full bg-lavender text-purple text-xs font-semibold flex items-center justify-center">
                      {j + 1}
                    </span>
                    <span className="pt-0.5">{it}</span>
                  </li>
                ))}
              </ol>
            );
          case "check":
            return (
              <ul key={i} className="space-y-2 text-[15px] leading-relaxed text-muted">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2">
                    <span aria-hidden className="text-ink shrink-0">
                      ☐
                    </span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            );
          case "code":
            return <CodeBlock key={i} lang={b.lang} title={b.title} code={b.code} />;
          case "callout":
            return (
              <div
                key={i}
                className={
                  b.tone === "warn"
                    ? "rounded-2xl border border-line bg-warning-soft p-4 text-[15px] leading-relaxed text-ink"
                    : "rounded-2xl border border-line bg-lavender p-4 text-[15px] leading-relaxed text-ink"
                }
              >
                {b.text}
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
