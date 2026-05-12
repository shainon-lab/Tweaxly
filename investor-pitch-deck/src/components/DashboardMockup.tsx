// Stylized Tweaxly product mockup for the deck. Mirrors the real product's
// design language: dark sidebar, light dashboard cards, KPI tiles, a small
// cashflow chart, and an alerts list. Numbers are illustrative.

const KPI = [
  { label: "Revenue",    value: "$184,200", delta: "+12.4%", tone: "good" as const },
  { label: "Expenses",   value: "$112,860", delta: "+3.1%",  tone: "warn" as const },
  { label: "Net profit", value: "$71,340",  delta: "+18.7%", tone: "good" as const },
];

const ALERTS = [
  { tone: "warn" as const, text: "Marketing up 22% in Apr 2026 vs Mar 2026, revenue flat." },
  { tone: "good" as const, text: "Net margin in Apr 2026: 24% — healthy."                  },
  { tone: "bad"  as const, text: "May 2026 forecast to run negative by $4,200."            },
];

const TREND = [62, 70, 78, 71, 84, 90, 95, 88];

// Mirrors the real product sidebar order — keeps the mockup honest.
const SIDEBAR_NAV = [
  { icon: "▤", label: "Dashboard", active: true },
  { icon: "✦", label: "Insights" },
  { icon: "▦", label: "Reports" },
  { icon: "☰", label: "Workforce Overview" },
  { icon: "↗", label: "Forecast" },
  { icon: "⚐", label: "Set notifications" },
  { icon: "✉", label: "Consultation" },
];

export default function DashboardMockup() {
  const W = 320, H = 90, PAD = 6;
  const max = Math.max(...TREND), min = Math.min(...TREND);
  const dx = (W - PAD * 2) / (TREND.length - 1);
  const points = TREND.map((v, i) => {
    const x = PAD + i * dx;
    const y = PAD + (H - PAD * 2) * (1 - (v - min) / Math.max(1, max - min));
    return [x, y] as const;
  });
  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${points[points.length - 1][0].toFixed(1)} ${H - PAD} L${points[0][0].toFixed(1)} ${H - PAD} Z`;

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[32px] opacity-50 blur-2xl"
        style={{
          background:
            "radial-gradient(60% 50% at 30% 30%, rgba(124,92,250,0.18) 0%, transparent 60%), radial-gradient(60% 50% at 70% 70%, rgba(34,211,238,0.18) 0%, transparent 60%)",
        }}
      />
      <div className="rounded-2xl border border-line bg-white shadow-2xl overflow-hidden grid grid-cols-[160px_1fr] max-w-[820px] mx-auto">
        {/* Sidebar */}
        <div
          className="bg-[#0a1428] text-white p-3 flex flex-col gap-1"
          style={{ minHeight: 380 }}
        >
          <div className="px-2 py-3 border-b border-white/10 mb-2">
            <div className="text-sm font-bold tracking-wider">
              TWEA
              <span
                className="font-black"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                X
              </span>
              LY
            </div>
            <div className="text-[8px] uppercase tracking-[0.15em] text-slate-400 mt-1">
              AI-Powered Business Intelligence
            </div>
          </div>
          {SIDEBAR_NAV.map((n) => (
            <div
              key={n.label}
              className={`px-2 py-1.5 rounded-md text-[11px] flex items-center gap-2 ${
                n.active ? "bg-violet-500/20 text-violet-200" : "text-slate-300"
              }`}
            >
              <span className="text-slate-400 w-3">{n.icon}</span>
              <span>{n.label}</span>
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="p-5 bg-white">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ink-500">
                Apr 2026 · Latest complete month
              </div>
              <div className="text-base font-semibold text-ink-900 mt-0.5">Dashboard</div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-ink-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live
            </div>
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {KPI.map((k) => (
              <div key={k.label} className="rounded-lg border border-line bg-ink-50/60 p-2.5">
                <div className="text-[9px] uppercase tracking-wider text-ink-500">{k.label}</div>
                <div className="text-base font-semibold text-ink-900 mt-0.5">{k.value}</div>
                <div
                  className={`text-[10px] mt-0.5 ${
                    k.tone === "good" ? "text-emerald-600" : k.tone === "warn" ? "text-amber-600" : "text-rose-600"
                  }`}
                >
                  {k.delta} vs Mar 2026
                </div>
              </div>
            ))}
          </div>

          {/* Cashflow chart */}
          <div className="rounded-lg border border-line p-3 mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-xs font-medium text-ink-900">Cashflow forecast</div>
              <div className="text-[9px] text-ink-500">Next 8 weeks</div>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[80px]" preserveAspectRatio="none">
              <defs>
                <linearGradient id="mock-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%"  stopColor="#7c5cfa" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="mock-stroke" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%"   stopColor="#7c5cfa" />
                  <stop offset="50%"  stopColor="#4f7dff" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#mock-fill)" />
              <path
                d={linePath}
                fill="none"
                stroke="url(#mock-stroke)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Alerts strip */}
          <div className="rounded-lg border border-line p-3">
            <div className="text-[9px] uppercase tracking-wider text-ink-500 mb-2">
              Business signals
            </div>
            <ul className="space-y-1.5">
              {ALERTS.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-ink-700">
                  <span className={`pill-${a.tone} shrink-0 mt-0.5`}>{a.tone}</span>
                  <span>{a.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
