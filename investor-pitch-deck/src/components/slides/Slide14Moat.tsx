import SlideShell, { SlideTitle, SlideLead } from "../SlideShell";

const LAYERS = [
  {
    title: "Normalized business behavior",
    body: "A canonical model of how money moves through an SMB — across every system, every category, every period.",
  },
  {
    title: "Operational context",
    body: "Each transaction inherits the business meaning around it: vendor, recurrence, role in the business.",
  },
  {
    title: "Financial categorization",
    body: "Automatic, rules-aware, owner-tunable. The categorization gets sharper with every business that uses it.",
  },
  {
    title: "Business signal engine",
    body: "Continuously evaluates the business against learned thresholds and explicit owner rules.",
  },
  {
    title: "Forecasting intelligence",
    body: "Forward-looking projections grounded in the actual trail of the business — not generic benchmarks.",
  },
  {
    title: "Decision history",
    body: "Every recommendation, scenario, and outcome compounds into a richer advisor over time.",
  },
];

export default function Slide14Moat({ total }: { total: number }) {
  return (
    <SlideShell number={14} total={total} eyebrow="The moat">
      <SlideTitle>
        The moat is <span className="gradient-text">contextual financial intelligence</span>.
      </SlideTitle>
      <SlideLead>
        Raw financial data is a commodity. What compounds is everything we build on top of it.
      </SlideLead>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl">
        {LAYERS.map((l, i) => (
          <div key={i} className="card">
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-500 mb-2 font-mono">
              Layer {String(i + 1).padStart(2, "0")}
            </div>
            <div className="text-base md:text-lg font-semibold text-ink-900 mb-2">
              {l.title}
            </div>
            <p className="text-sm text-ink-600 leading-relaxed">{l.body}</p>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}
