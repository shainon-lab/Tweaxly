import SlideShell, { SlideTitle } from "../SlideShell";

const ARE = [
  "Financial visibility",
  "Business intelligence",
  "Forecasting & scenario planning",
  "Workforce financial intelligence",
  "Decision support",
  "AI CFO",
];

const NOT = [
  "ERP",
  "Accounting software",
  "HR / payroll system",
  "Inventory management",
  "CRM",
  "Invoice management",
];

export default function Slide06Philosophy({ total }: { total: number }) {
  return (
    <SlideShell number={6} total={total} eyebrow="Product philosophy">
      <SlideTitle>
        What Tweaxly <span className="gradient-text">is</span>.<br />
        What Tweaxly is <span className="text-rose-500">not</span>.
      </SlideTitle>

      <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
        <div
          className="rounded-2xl p-8 border border-line"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(124,92,250,0.08) 0%, rgba(34,211,238,0.08) 100%)",
          }}
        >
          <div className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-4">
            What we are
          </div>
          <ul className="space-y-3">
            {ARE.map((x) => (
              <li key={x} className="flex items-center gap-3 text-lg font-medium text-ink-900">
                <span
                  className="inline-flex w-6 h-6 rounded-full items-center justify-center text-white text-xs font-bold"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, #7c5cfa 0%, #22d3ee 100%)",
                  }}
                >
                  ✓
                </span>
                {x}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl p-8 border border-line bg-ink-50">
          <div className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-4">
            What we are not
          </div>
          <ul className="space-y-3">
            {NOT.map((x) => (
              <li key={x} className="flex items-center gap-3 text-lg text-ink-600 line-through decoration-rose-300/70 decoration-1">
                <span className="inline-flex w-6 h-6 rounded-full items-center justify-center text-rose-600 bg-white border border-rose-200 text-xs font-bold no-underline">
                  ✕
                </span>
                <span className="not-italic">{x}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SlideShell>
  );
}
