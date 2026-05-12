import SlideShell, { SlideTitle, SlideLead } from "../SlideShell";

const STRUGGLES = [
  "where money goes",
  "operational impact",
  "recurring vs one-time costs",
  "profitability trends",
  "payroll growth",
  "future cashflow impact",
];

export default function Slide03Insight({ total }: { total: number }) {
  return (
    <SlideShell number={3} total={total} eyebrow="The core insight">
      <SlideTitle>
        Revenue is usually simple.<br />
        <span className="gradient-text">Expenses</span> are what kill businesses.
      </SlideTitle>
      <SlideLead>
        Small businesses generally understand how money comes in. What they struggle with is everything that happens after.
      </SlideLead>

      <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
        <div className="card border-emerald-200">
          <div className="text-xs uppercase tracking-wider text-emerald-700 font-semibold mb-2">
            Revenue
          </div>
          <div className="text-lg font-semibold text-ink-900 mb-3">
            Relatively simple
          </div>
          <p className="text-sm text-ink-600 leading-relaxed">
            A handful of sources, easy to track, easy to celebrate. Owners know
            roughly what their top line looks like at any moment.
          </p>
          <div className="mt-4 h-2 rounded-full bg-emerald-100 overflow-hidden">
            <div className="h-full w-3/4 bg-emerald-500/80" />
          </div>
        </div>

        <div
          className="card"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(124,92,250,0.06) 0%, rgba(34,211,238,0.06) 100%)",
          }}
        >
          <div className="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-2">
            Expenses
          </div>
          <div className="text-lg font-semibold text-ink-900 mb-3">
            Fragmented complexity
          </div>
          <ul className="space-y-1.5 text-sm text-ink-700">
            {STRUGGLES.map((s) => (
              <li key={s} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-ink-400" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SlideShell>
  );
}
