import SlideShell, { SlideTitle, SlideLead } from "../SlideShell";
import DashboardMockup from "../DashboardMockup";

const STEPS = [
  "Connect systems",
  "Normalize & categorize",
  "Visualize across 4 modules",
  "Surface business signals",
  "Model scenarios in Forecast",
  "Track workforce cost reality",
  "Support every owner decision",
];

export default function Slide07Product({ total }: { total: number }) {
  return (
    <SlideShell number={7} total={total} eyebrow="Product experience" bgVariant="soft">
      <SlideTitle>
        From fragmented data to <span className="gradient-text">business clarity</span>.
      </SlideTitle>
      <SlideLead>
        Owners see the right numbers in the right context — the dashboard, not the ledger.
      </SlideLead>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 items-start">
        <ol className="space-y-2.5">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-3">
              <span
                className="inline-flex w-7 h-7 rounded-full items-center justify-center text-white text-xs font-bold shrink-0"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #7c5cfa 0%, #4f7dff 50%, #22d3ee 100%)",
                }}
              >
                {i + 1}
              </span>
              <span className="text-sm md:text-base text-ink-800">{s}</span>
            </li>
          ))}
        </ol>
        <div>
          <DashboardMockup />
          <div className="text-center text-xs text-ink-500 mt-3">
            Tweaxly dashboard · real product UI
          </div>
        </div>
      </div>
    </SlideShell>
  );
}
