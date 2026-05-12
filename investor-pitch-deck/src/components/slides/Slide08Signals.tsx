import SlideShell, { SlideTitle, SlideLead } from "../SlideShell";

const SIGNALS: { tone: "warn" | "bad" | "good"; text: string }[] = [
  { tone: "warn", text: "Payroll increased 18% across Nov 2025 – Apr 2026."           },
  { tone: "warn", text: "Marketing up 22% in Apr 2026 vs Mar 2026, revenue flat."     },
  { tone: "bad",  text: "May 2026 forecast to run negative by $4,200."                },
  { tone: "warn", text: "Software costs jumped 34% from Q4 2025 to Q1 2026."          },
  { tone: "bad",  text: "Revenue declined in Feb, Mar, and Apr 2026."                 },
  { tone: "good", text: "Net margin in Apr 2026: 24% — healthy."                      },
];

export default function Slide08Signals({ total }: { total: number }) {
  return (
    <SlideShell number={8} total={total} eyebrow="Smart signals">
      <SlideTitle>
        Your business <span className="gradient-text">watches itself</span>.
      </SlideTitle>
      <SlideLead>
        Tweaxly proactively detects operational and financial changes — so the owner doesn&apos;t have to find them by accident in next quarter&apos;s reports.
      </SlideLead>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-5xl">
        {SIGNALS.map((s, i) => (
          <div key={i} className="card card-hover flex items-start gap-3 py-4">
            <span
              className={`mt-0.5 inline-flex w-8 h-8 rounded-full items-center justify-center text-xs font-bold shrink-0 ${
                s.tone === "bad"
                  ? "bg-rose-50 text-rose-600 border border-rose-200"
                  : s.tone === "warn"
                    ? "bg-amber-50 text-amber-600 border border-amber-200"
                    : "bg-emerald-50 text-emerald-600 border border-emerald-200"
              }`}
            >
              !
            </span>
            <div>
              <div className="text-sm md:text-base text-ink-900 font-medium leading-snug">
                {s.text}
              </div>
              <div className="text-xs text-ink-500 mt-1">
                Detected automatically · up to 5 signals · refresh rotates the mix
              </div>
            </div>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}
