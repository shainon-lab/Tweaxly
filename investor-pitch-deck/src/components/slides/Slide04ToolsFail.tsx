import SlideShell, { SlideTitle, SlideLead } from "../SlideShell";

const TOOLS = [
  { name: "Accounting software", subtitle: "QuickBooks, Xero" },
  { name: "ERP systems", subtitle: "NetSuite, SAP" },
  { name: "Bookkeeping tools", subtitle: "Bench, Pilot" },
  { name: "Spreadsheets", subtitle: "Excel, Google Sheets" },
];

const PROBLEMS = [
  "Backward-looking",
  "Operationally disconnected",
  "Hard to understand",
  "No forecasting",
  "No decision support",
  "No contextual intelligence",
];

export default function Slide04ToolsFail({ total }: { total: number }) {
  return (
    <SlideShell number={4} total={total} eyebrow="Existing tools fail">
      <SlideTitle>
        Current software <span className="gradient-text">records transactions</span>.<br />
        It doesn&apos;t explain the business.
      </SlideTitle>
      <SlideLead>
        Owners are stuck reading the past in ledgers, then reverse-engineering what it means about the future.
      </SlideLead>

      <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-4">
            What SMBs use today
          </div>
          <div className="space-y-2.5">
            {TOOLS.map((t) => (
              <div key={t.name} className="card py-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-ink-900">{t.name}</div>
                  <div className="text-xs text-ink-500 mt-0.5">{t.subtitle}</div>
                </div>
                <span className="pill-bad">records only</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-4">
            Where they fall short
          </div>
          <ul className="space-y-3">
            {PROBLEMS.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-1 inline-flex w-5 h-5 rounded-full items-center justify-center text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 shrink-0">
                  ✕
                </span>
                <span className="text-base text-ink-800">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SlideShell>
  );
}
