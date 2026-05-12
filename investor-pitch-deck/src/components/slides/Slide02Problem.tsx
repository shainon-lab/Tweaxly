import SlideShell, { SlideTitle } from "../SlideShell";

const POINTS = [
  "Most SMB owners rely on bank balance",
  "Financial understanding comes too late",
  "Expenses grow silently",
  "Hiring decisions are emotional",
  "Forecasting barely exists",
  "Data is fragmented across systems",
  "SMBs rarely have CFO-level visibility",
];

export default function Slide02Problem({ total }: { total: number }) {
  return (
    <SlideShell number={2} total={total} eyebrow="The problem">
      <SlideTitle>
        Small businesses run <span className="gradient-text">financially blind</span>.
      </SlideTitle>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12 items-start">
        <ul className="md:col-span-3 space-y-3 text-base md:text-lg text-ink-700">
          {POINTS.map((p, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-ink-400 shrink-0" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <div className="md:col-span-2">
          <ChaosVisual />
          <div className="mt-4 text-xs text-ink-500 text-center">
            Bank · Cards · Stripe · Payroll · Invoices · Spreadsheets
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

// Visual: scattered system icons flowing into a question-mark cloud.
function ChaosVisual() {
  return (
    <svg viewBox="0 0 320 240" className="w-full" aria-hidden>
      <defs>
        <linearGradient id="chaos-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c5cfa" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      {/* scattered chips representing source systems */}
      {[
        { x: 20, y: 20, t: "Bank" },
        { x: 130, y: 10, t: "Cards" },
        { x: 230, y: 30, t: "Stripe" },
        { x: 30, y: 90, t: "Payroll" },
        { x: 180, y: 95, t: "Invoices" },
        { x: 90, y: 60, t: "PayPal" },
        { x: 240, y: 110, t: "Sheets" },
      ].map((c, i) => (
        <g key={i}>
          <rect
            x={c.x}
            y={c.y}
            width="70"
            height="22"
            rx="11"
            fill="#ffffff"
            stroke="#e5e7eb"
          />
          <text
            x={c.x + 35}
            y={c.y + 15}
            textAnchor="middle"
            fontSize="11"
            fill="#475569"
          >
            {c.t}
          </text>
        </g>
      ))}
      {/* messy arrows converging */}
      {[
        { x1: 55, y1: 42, x2: 160, y2: 175 },
        { x1: 165, y1: 32, x2: 165, y2: 175 },
        { x1: 265, y1: 52, x2: 175, y2: 178 },
        { x1: 65, y1: 112, x2: 160, y2: 180 },
        { x1: 215, y1: 117, x2: 175, y2: 178 },
        { x1: 125, y1: 82, x2: 165, y2: 175 },
      ].map((l, i) => (
        <path
          key={i}
          d={`M${l.x1} ${l.y1} Q ${(l.x1 + l.x2) / 2} ${l.y1 + 30} ${l.x2} ${l.y2}`}
          stroke="#cbd5e1"
          strokeWidth="1"
          strokeDasharray="3 3"
          fill="none"
        />
      ))}
      {/* "?" cloud at the bottom */}
      <ellipse cx="165" cy="195" rx="60" ry="30" fill="url(#chaos-g)" opacity="0.15" />
      <text
        x="165"
        y="208"
        textAnchor="middle"
        fontSize="32"
        fontWeight="700"
        fill="url(#chaos-g)"
      >
        ?
      </text>
    </svg>
  );
}
