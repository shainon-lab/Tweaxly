import SlideShell, { SlideTitle, SlideLead } from "../SlideShell";

const INPUTS = ["Banks", "Credit Cards", "Payroll", "Stripe", "PayPal", "Invoices"];
const OUTPUTS = [
  "Live dashboard & KPIs",
  "Insights — 7 charts, one filter",
  "Business signals",
  "Workforce intelligence",
  "Forecast — baseline vs scenario",
  "AI advisor & threshold alerts",
];

export default function Slide05Solution({ total }: { total: number }) {
  return (
    <SlideShell number={5} total={total} eyebrow="The solution" bgVariant="soft">
      <SlideTitle>
        The <span className="gradient-text">AI financial intelligence layer</span> for SMBs.
      </SlideTitle>
      <SlideLead>
        Tweaxly connects every system your business already uses and turns scattered transactions into a single live view of how the business is performing — and where it&apos;s going.
      </SlideLead>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center max-w-5xl">
        {/* Inputs column */}
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-3">
            Inputs
          </div>
          <div className="grid grid-cols-2 gap-2">
            {INPUTS.map((s) => (
              <div key={s} className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink-800 shadow-sm">
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Middle: the Tweaxly intelligence layer */}
        <div className="flex flex-col items-center gap-2">
          <ArrowRight className="md:rotate-0 rotate-90" />
          <div
            className="rounded-2xl px-6 py-5 text-center shadow-md text-white"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #7c5cfa 0%, #4f7dff 50%, #22d3ee 100%)",
            }}
          >
            <div className="text-[10px] uppercase tracking-[0.25em] opacity-80">
              Intelligence layer
            </div>
            <div className="text-base font-semibold mt-1">Tweaxly</div>
          </div>
          <ArrowRight className="md:rotate-0 rotate-90" />
        </div>

        {/* Outputs column */}
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-3">
            Outputs
          </div>
          <div className="space-y-2">
            {OUTPUTS.map((s) => (
              <div
                key={s}
                className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink-900 shadow-sm flex items-center gap-2"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background:
                      "linear-gradient(135deg, #7c5cfa 0%, #22d3ee 100%)",
                  }}
                />
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

function ArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg
      width="28"
      height="14"
      viewBox="0 0 28 14"
      className={`text-ink-300 ${className}`}
      aria-hidden
    >
      <path
        d="M0 7 L24 7 M18 1 L24 7 L18 13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
