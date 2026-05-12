import SlideShell, { SlideTitle, SlideLead } from "../SlideShell";

const INDUSTRIES = [
  "Agencies",
  "SaaS companies",
  "Clinics",
  "Consulting firms",
  "Service businesses",
];

const CHARACTERISTICS = [
  "No finance department",
  "Financial complexity growing",
  "Multiple financial systems",
  "Founder still heavily involved in decisions",
];

export default function Slide10Icp({ total }: { total: number }) {
  return (
    <SlideShell number={10} total={total} eyebrow="ICP">
      <SlideTitle>
        Who this is <span className="gradient-text">built for</span>.
      </SlideTitle>
      <SlideLead>
        Founder-led businesses with enough complexity to need a CFO — and not enough scale to hire one.
      </SlideLead>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
        <div className="card">
          <div className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-3">
            Primary ICP
          </div>
          <div className="space-y-3">
            <Row label="Stage" value="Founder-led SMBs" />
            <Row label="Team size" value="5–50 employees" />
            <Row label="Revenue" value="$50K – $1.5M / month" />
          </div>
        </div>

        <div className="card">
          <div className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-3">
            Ideal industries
          </div>
          <ul className="space-y-2 text-base text-ink-800">
            {INDUSTRIES.map((i) => (
              <li key={i} className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background:
                      "linear-gradient(135deg, #7c5cfa 0%, #22d3ee 100%)",
                  }}
                />
                {i}
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="text-xs uppercase tracking-[0.2em] text-ink-500 mb-3">
            Characteristics
          </div>
          <ul className="space-y-2 text-base text-ink-800">
            {CHARACTERISTICS.map((c) => (
              <li key={c} className="flex items-start gap-2">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-ink-400 shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SlideShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-500">{label}</div>
      <div className="text-base font-semibold text-ink-900">{value}</div>
    </div>
  );
}
