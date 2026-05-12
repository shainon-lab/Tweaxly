import SlideShell, { SlideTitle, SlideLead } from "../SlideShell";

export default function Slide12Market({ total }: { total: number }) {
  return (
    <SlideShell number={12} total={total} eyebrow="Market opportunity">
      <SlideTitle>
        Millions of SMBs operate without <span className="gradient-text">financial intelligence</span>.
      </SlideTitle>
      <SlideLead>
        The world has more small and medium businesses than ever. Almost none of them have a CFO, and almost all of them feel it.
      </SlideLead>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl">
        <Stat
          big="333M+"
          label="SMBs globally"
          note="Across developed & emerging markets"
        />
        <Stat
          big=">99%"
          label="have no in-house CFO"
          note="Yet most carry CFO-level complexity"
        />
        <Stat
          big="6–10"
          label="financial systems per SMB"
          note="Bank, cards, PSPs, payroll, invoicing…"
        />
        <Stat
          big="$30B+"
          label="annual SMB SaaS spend"
          note="Growing double-digits, mostly fragmented"
        />
      </div>

      <div className="mt-10 max-w-3xl text-sm text-ink-500 leading-relaxed">
        The TAM isn&apos;t accounting software (already a mature category). It&apos;s the <span className="text-ink-800 font-medium">intelligence layer above it</span> — currently absent from almost every SMB tech stack.
      </div>
    </SlideShell>
  );
}

function Stat({
  big,
  label,
  note,
}: {
  big: string;
  label: string;
  note: string;
}) {
  return (
    <div className="card">
      <div className="text-3xl md:text-4xl font-semibold tracking-tight">
        <span className="gradient-text">{big}</span>
      </div>
      <div className="mt-2 text-base font-medium text-ink-900">{label}</div>
      <div className="mt-1 text-xs text-ink-500">{note}</div>
    </div>
  );
}
