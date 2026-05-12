import SlideShell, { SlideTitle } from "../SlideShell";

const PHASES = [
  {
    n: "01",
    title: "Financial visibility & signals",
    body: "Connected systems, normalized transactions, Insights across 7 charts, and rotating Business Signals anchored to specific months.",
    state: "shipping" as const,
  },
  {
    n: "02",
    title: "Forecasting & workforce intelligence",
    body: "Decision-impact Forecast (baseline vs scenario) for hires, raises, marketing changes, contracts — plus a Workforce Overview showing real per-employee cost and payroll-to-revenue health.",
    state: "shipping" as const,
  },
  {
    n: "03",
    title: "AI CFO assistant",
    body: "Conversational interface that answers any business question using the owner's actual data — categories, vendors, payroll, forecasts. Initial release shipping.",
    state: "next" as const,
  },
  {
    n: "04",
    title: "Autonomous recommendations",
    body: "Tweaxly proactively proposes specific moves — and tracks whether they worked.",
    state: "vision" as const,
  },
];

const STATE_PILL: Record<typeof PHASES[number]["state"], string> = {
  shipping: "pill-good",
  next: "pill-warn",
  vision: "pill",
};
const STATE_TEXT: Record<typeof PHASES[number]["state"], string> = {
  shipping: "Shipping",
  next: "Next",
  vision: "Vision",
};

export default function Slide15Roadmap({ total }: { total: number }) {
  return (
    <SlideShell number={15} total={total} eyebrow="Product roadmap">
      <SlideTitle>
        From visibility to <span className="gradient-text">autonomy</span>.
      </SlideTitle>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl">
        {PHASES.map((p) => (
          <div key={p.n} className="card relative">
            <div className="absolute top-4 right-4">
              <span className={STATE_PILL[p.state]}>{STATE_TEXT[p.state]}</span>
            </div>
            <div
              className="text-3xl font-bold gradient-text leading-none"
              aria-hidden
            >
              {p.n}
            </div>
            <div className="mt-3 text-base md:text-lg font-semibold text-ink-900">
              {p.title}
            </div>
            <p className="mt-2 text-sm text-ink-600 leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 text-xs text-ink-500">
        Each phase deepens the moat: more data → richer signals → smarter forecasts → better recommendations.
      </div>
    </SlideShell>
  );
}
