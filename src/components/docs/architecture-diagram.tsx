/**
 * Architecture diagram for the docs. Inline SVG so it adapts to light/dark
 * theme (boxes use the theme CSS variables; the blockchain branch uses the
 * static blue → purple → magenta brand gradient). Wrapped in a horizontal
 * scroller so it stays legible on narrow screens.
 */

const W = 220;

function LabeledBox({
  x,
  y,
  h,
  gradient = false,
  lines,
}: {
  x: number;
  y: number;
  h: number;
  gradient?: boolean;
  lines: string[];
}) {
  const cx = x + W / 2;
  const lineH = 17;
  const first = y + (h - lines.length * lineH) / 2 + 14;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={W}
        height={h}
        rx={14}
        fill="var(--card)"
        stroke={gradient ? "url(#vb-grad)" : "var(--line)"}
        strokeWidth={gradient ? 2 : 1.5}
      />
      {lines.map((line, i) => (
        <text
          key={i}
          x={cx}
          y={first + i * lineH}
          textAnchor="middle"
          fontSize={i === 0 ? 13 : 11}
          fontWeight={i === 0 ? 600 : 400}
          fill={i === 0 ? "var(--ink)" : "var(--muted)"}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function Arrow({ d }: { d: string }) {
  return (
    <path d={d} fill="none" stroke="var(--muted)" strokeWidth={1.5} markerEnd="url(#vb-arrow)" />
  );
}

export function ArchitectureDiagram() {
  return (
    <figure className="my-2">
      <div className="overflow-x-auto -mx-4 px-4">
        <svg
          viewBox="0 0 720 600"
          className="w-full min-w-[560px]"
          role="img"
          aria-label="VerseBill architecture: frontend to API layer to Supabase Postgres and the Polygon blockchain, ending in on-chain verification"
        >
          <defs>
            <linearGradient id="vb-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#168bff" />
              <stop offset="50%" stopColor="#6d35f2" />
              <stop offset="100%" stopColor="#d500f9" />
            </linearGradient>
            <marker
              id="vb-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted)" />
            </marker>
          </defs>

          {/* Row 1 — frontend */}
          <LabeledBox x={250} y={16} h={58} lines={["Frontend", "Next.js · React · Tailwind"]} />
          <Arrow d="M 360 74 L 360 112" />

          {/* Row 2 — API layer */}
          <LabeledBox
            x={250}
            y={112}
            h={58}
            lines={["Application / API layer", "Route handlers · Zod · Privy"]}
          />

          {/* Split into database + blockchain branches */}
          <path d="M 360 170 L 360 192" fill="none" stroke="var(--muted)" strokeWidth={1.5} />
          <path d="M 200 192 L 520 192" fill="none" stroke="var(--muted)" strokeWidth={1.5} />
          <Arrow d="M 200 192 L 200 232" />
          <Arrow d="M 520 192 L 520 232" />

          {/* Database branch */}
          <LabeledBox x={90} y={232} h={58} lines={["Supabase / Postgres", "Prisma ORM"]} />
          <Arrow d="M 200 290 L 200 328" />
          <LabeledBox
            x={90}
            y={328}
            h={74}
            lines={["Entities", "User · Merchant · Invoice", "Payment · AuditLog"]}
          />

          {/* Blockchain branch */}
          <LabeledBox x={410} y={232} h={58} gradient lines={["Blockchain RPC", "viem public client"]} />
          <Arrow d="M 520 290 L 520 328" />
          <LabeledBox x={410} y={328} h={58} gradient lines={["Polygon PoS", "Chain ID 137"]} />
          <Arrow d="M 520 386 L 520 424" />
          <LabeledBox x={410} y={424} h={58} gradient lines={["VERSE", "ERC-20 token"]} />
          <Arrow d="M 520 482 L 520 520" />
          <LabeledBox
            x={410}
            y={520}
            h={58}
            gradient
            lines={["On-chain verification", "PAID only after confirm"]}
          />
        </svg>
      </div>
      <figcaption className="mt-3 text-sm text-muted">
        Verification reads the transaction and receipt from the RPC, then writes the confirmed
        status back to Postgres. The browser never talks to the database or the RPC directly.
      </figcaption>
    </figure>
  );
}
