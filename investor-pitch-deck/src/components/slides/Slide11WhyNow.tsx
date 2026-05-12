import SlideShell, { SlideTitle } from "../SlideShell";

const POINTS: { year: string; title: string; body: string }[] = [
  {
    year: "2015–2020",
    title: "SMB software exploded",
    body: "Dozens of point tools — banking, billing, payroll, e-commerce — each owning a slice of the business.",
  },
  {
    year: "2020–2024",
    title: "Financial data fragmented",
    body: "Owners now juggle 6–10 systems to answer one question. Spreadsheets are the only thing that ties them together.",
  },
  {
    year: "2024",
    title: "AI understands business context",
    body: "LLMs can finally reason about a business's real numbers — not just summarize them, but explain them.",
  },
  {
    year: "Now",
    title: "Economic pressure raises the cost of being blind",
    body: "Capital tightened. Margins compressed. Owners need CFO-level visibility — but most still can't afford a CFO.",
  },
];

export default function Slide11WhyNow({ total }: { total: number }) {
  return (
    <SlideShell number={11} total={total} eyebrow="Why now">
      <SlideTitle>
        Why <span className="gradient-text">now</span>.
      </SlideTitle>

      <div className="mt-12 relative max-w-5xl">
        {/* Vertical timeline rail */}
        <div className="absolute left-[100px] md:left-[120px] top-0 bottom-0 w-px bg-line" />
        <div className="space-y-7">
          {POINTS.map((p, i) => (
            <div key={i} className="grid grid-cols-[100px_1fr] md:grid-cols-[120px_1fr] gap-6 items-start">
              <div className="text-right text-sm font-mono text-ink-500 pt-1">
                {p.year}
              </div>
              <div className="relative">
                <span
                  className="absolute -left-[34px] md:-left-[38px] top-2 w-3 h-3 rounded-full ring-4 ring-white"
                  style={{
                    background:
                      "linear-gradient(135deg, #7c5cfa 0%, #22d3ee 100%)",
                  }}
                />
                <div className="text-lg md:text-xl font-semibold text-ink-900">
                  {p.title}
                </div>
                <p className="text-sm md:text-base text-ink-600 mt-1.5 max-w-2xl leading-relaxed">
                  {p.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}
