// Native HTML/CSS mockup of the product's Signal Deck. Mirrors the
// real cards in tweaxly/business-signals — same dot · badge · title ·
// metric · subtitle rhythm — so visitors see the actual UI vocabulary
// instead of a static screenshot.

type SignalTone = "critical" | "watch" | "good" | "info";

type Signal = {
  tone: SignalTone;
  badge: string;
  category: string;
  title: string;
  metric: string;
  metricArrow?: "up" | "down";
  subtitle: string;
  lifecycle?: string;
};

const TONE: Record<SignalTone, { dot: string; border: string; glow: string; badgeText: string; arrow: string }> = {
  critical: {
    dot: "bg-bad",
    border: "border-bad/50",
    glow: "shadow-[0_0_30px_-8px_rgba(239,91,91,0.45)]",
    badgeText: "text-slate-200",
    arrow: "text-bad",
  },
  watch: {
    dot: "bg-warn",
    border: "border-warn/45",
    glow: "",
    badgeText: "text-slate-200",
    arrow: "text-warn",
  },
  good: {
    dot: "bg-good",
    border: "border-good/35",
    glow: "",
    badgeText: "text-slate-200",
    arrow: "text-good",
  },
  info: {
    dot: "bg-slate-400",
    border: "border-line",
    glow: "",
    badgeText: "text-slate-300",
    arrow: "text-slate-300",
  },
};

function SignalMockCard({ s, dim }: { s: Signal; dim?: boolean }) {
  const t = TONE[s.tone];
  const arrowChar = s.metricArrow === "up" ? "↑" : s.metricArrow === "down" ? "↓" : "";
  return (
    <div
      className={`rounded-2xl border ${t.border} ${t.glow} ${dim ? "opacity-70" : ""} bg-ink-900/60 p-4 flex flex-col gap-2 backdrop-blur-sm`}
    >
      <div className="flex items-center gap-2 text-[10px] text-slate-400">
        <span
          className={`w-1.5 h-1.5 rounded-full ${t.dot} ${s.tone === "critical" ? "anim-pulse-soft" : ""}`}
        />
        <span className={`font-medium tracking-wide ${t.badgeText}`}>{s.badge}</span>
        <span className="text-slate-600">·</span>
        <span>{s.category}</span>
        {s.lifecycle ? (
          <>
            <span className="text-slate-600">·</span>
            <span className="text-brand-purple font-medium">{s.lifecycle}</span>
          </>
        ) : null}
      </div>
      <div className="text-[15px] font-semibold text-slate-50 leading-tight">{s.title}</div>
      <div className="text-2xl font-bold text-white leading-none tabular-nums tracking-tight">
        {arrowChar ? <span className={`${t.arrow} mr-1`}>{arrowChar}</span> : null}
        {s.metric}
      </div>
      <div className="text-xs text-slate-400 leading-snug line-clamp-2">{s.subtitle}</div>
    </div>
  );
}

const FULL_SIGNALS: Signal[] = [
  { tone: "critical", badge: "Critical", category: "Cash flow",  title: "Cash Risk",         metric: "$42,180", metricArrow: "down", subtitle: "Next month is forecast negative.", lifecycle: "Escalating" },
  { tone: "critical", badge: "Critical", category: "Vendor",     title: "Vendor Spike",      metric: "+38%",    metricArrow: "up",   subtitle: "Stripe Atlas cost rose sharply.",  lifecycle: "New" },
  { tone: "watch",    badge: "Watch",    category: "Payroll",    title: "Payroll Pressure",  metric: "71%",                          subtitle: "Heavy for your current run-rate." },
  { tone: "watch",    badge: "Watch",    category: "Marketing",  title: "Marketing Pressure",metric: "29%",     metricArrow: "up",   subtitle: "Above the 25% revenue guardrail." },
  { tone: "good",     badge: "Growth",   category: "Growth",     title: "Growth Headroom",   metric: "40.9%",                        subtitle: "Margin supports scaling marketing." },
  { tone: "info",     badge: "FYI",      category: "Revenue",    title: "Net Margin",        metric: "23.4%",                        subtitle: "This month's profitability snapshot." },
];

// Full product-accurate deck — used inside the Business Signals section.
export function SignalDeckFull() {
  return (
    <div className="glass p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-100">Signals</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-brand-purple/40 bg-brand-purple/10 text-brand-purple uppercase tracking-wider">
            AI advisor
          </span>
        </div>
        <div className="text-[11px] text-slate-500">updated 3m ago</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {FULL_SIGNALS.map((s, i) => (
          <SignalMockCard key={i} s={s} />
        ))}
      </div>
    </div>
  );
}

// Compact stylized deck for the hero — 4 cards in a tight grid with
// floating cards drifting alongside it.
export function SignalDeckHero() {
  const heroSignals: Signal[] = [FULL_SIGNALS[0], FULL_SIGNALS[1], FULL_SIGNALS[3], FULL_SIGNALS[4]];
  return (
    <div className="relative">
      {/* Ambient glow behind the deck */}
      <div className="absolute -inset-10 rounded-[40px] bg-[radial-gradient(ellipse_at_center,rgba(167,139,250,0.18),transparent_70%)] pointer-events-none" aria-hidden="true" />

      {/* Faint workspace grid behind */}
      <div className="absolute inset-0 grid-bg opacity-40 rounded-3xl pointer-events-none" aria-hidden="true" />

      <div className="relative glass p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-100">Signals</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-brand-purple/40 bg-brand-purple/10 text-brand-purple uppercase tracking-wider">
              Live
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-good anim-pulse-soft" />
            Analyzing
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {heroSignals.map((s, i) => (
            <SignalMockCard key={i} s={s} />
          ))}
        </div>
      </div>

      {/* Floating insight chips around the deck — subtle motion */}
      <div className="hidden lg:block absolute -top-8 -left-12 anim-float-slow">
        <FloatChip tone="good" label="Trend detected" body="Marketing efficiency improving 3 months running." />
      </div>
      <div className="hidden lg:block absolute -bottom-10 -right-10 anim-float">
        <FloatChip tone="purple" label="Opportunity" body="$11.2K/mo headroom for growth investment." />
      </div>
    </div>
  );
}

function FloatChip({
  tone,
  label,
  body,
}: { tone: "good" | "purple" | "warn"; label: string; body: string }) {
  const color =
    tone === "good"   ? "border-good/40 bg-good/10 text-good"          :
    tone === "warn"   ? "border-warn/40 bg-warn/10 text-warn"          :
                        "border-brand-purple/40 bg-brand-purple/10 text-brand-purple";
  return (
    <div className="w-64 rounded-xl border border-line bg-ink-900/85 backdrop-blur p-3 shadow-2xl shadow-black/40">
      <div className={`text-[10px] uppercase tracking-wider font-medium ${color} inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5`}>
        <span className="w-1 h-1 rounded-full bg-current" />
        {label}
      </div>
      <div className="mt-2 text-xs text-slate-200 leading-snug">{body}</div>
    </div>
  );
}
