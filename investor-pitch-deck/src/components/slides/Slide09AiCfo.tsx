import SlideShell, { SlideTitle, SlideLead } from "../SlideShell";

const PROMPTS = [
  "Where can I save $20,000?",
  "Can I afford another employee?",
  "Why did profitability drop in March?",
  "What happens if revenue drops 15%?",
  "How does hiring two engineers change my runway?",
  "Which expense category is growing fastest?",
];

export default function Slide09AiCfo({ total }: { total: number }) {
  return (
    <SlideShell number={9} total={total} eyebrow="AI CFO layer" bgVariant="soft">
      <SlideTitle>
        Ask business questions.<br />
        Get <span className="gradient-text">operational answers</span>.
      </SlideTitle>
      <SlideLead>
        Tweaxly becomes an AI financial advisor for SMB owners — grounded in their real numbers, not generic finance lecture.
      </SlideLead>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 items-start max-w-5xl">
        {/* Left: prompts column */}
        <div className="space-y-2.5">
          <div className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-3">
            Example questions
          </div>
          {PROMPTS.map((q, i) => (
            <div
              key={i}
              className="card flex items-start gap-3 py-4"
            >
              <span className="inline-flex w-7 h-7 rounded-md items-center justify-center text-xs font-semibold text-violet-600 bg-violet-50 shrink-0 mt-0.5">
                {(i + 1).toString().padStart(2, "0")}
              </span>
              <div className="text-base text-ink-800 leading-snug">
                &ldquo;{q}&rdquo;
              </div>
            </div>
          ))}
        </div>

        {/* Right: a sample answer card */}
        <AdvisorMockup />
      </div>
    </SlideShell>
  );
}

function AdvisorMockup() {
  return (
    <div className="card p-0 overflow-hidden">
      <div
        className="px-5 py-3 text-white flex items-center justify-between"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #7c5cfa 0%, #4f7dff 50%, #22d3ee 100%)",
        }}
      >
        <div className="text-sm font-semibold">AI CFO · Saving $20,000</div>
        <div className="text-[10px] uppercase tracking-wider opacity-80">
          Grounded in your data
        </div>
      </div>
      <div className="p-5">
        <div className="text-xs text-ink-500 mb-2">Suggested path</div>
        <div className="rounded-lg border border-line bg-ink-50/60 p-4 mb-3">
          <div className="text-sm font-semibold text-ink-900 mb-1">
            Recommended mix · <span className="gradient-text">$2,667/mo</span>
          </div>
          <p className="text-xs text-ink-700 leading-relaxed">
            Trim underperforming ad channel (-$2,400/mo), consolidate two SaaS subscriptions (-$267/mo). Spreads the impact across categories; no single area absorbs the full hit.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border border-line p-3">
            <div className="text-[10px] uppercase tracking-wider text-ink-500">3-month coverage</div>
            <div className="text-sm font-semibold text-ink-900 mt-0.5">40% of target</div>
          </div>
          <div className="rounded-md border border-line p-3">
            <div className="text-[10px] uppercase tracking-wider text-ink-500">Runway gained</div>
            <div className="text-sm font-semibold text-ink-900 mt-0.5">+1.8 months</div>
          </div>
        </div>
      </div>
    </div>
  );
}
