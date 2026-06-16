// Mockup of the Executive Overview surface - a 4-tile KPI grid plus
// a Decision Anchor card on the right that mirrors the product's
// AI-narrative panel.

type Tile = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  trendIsGood: boolean;
};

const TILES: Tile[] = [
  { label: "Revenue",      value: "$58,420", delta: "+12%", trend: "up",   trendIsGood: true  },
  { label: "Expenses",     value: "$31,840", delta: "−3%",  trend: "down", trendIsGood: true  },
  { label: "Net Profit",   value: "$26,580", delta: "+38%", trend: "up",   trendIsGood: true  },
  { label: "Cash Runway",  value: "6.2 mo",  delta: "+0.4", trend: "up",   trendIsGood: true  },
];

function Sparkline({ trendIsGood }: { trendIsGood: boolean }) {
  // A few preset paths so each tile has variation.
  const points = "0,18 12,15 24,17 36,12 48,14 60,10 72,11 84,6";
  const stroke = trendIsGood ? "#3ecf8e" : "#ef5b5b";
  return (
    <svg viewBox="0 0 84 20" className="w-full h-5 mt-3" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ExecutiveOverviewMock() {
  return (
    <div className="product-dark rounded-2xl p-4 grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* KPI Tiles */}
      <div className="lg:col-span-3 grid grid-cols-2 gap-3">
        {TILES.map((t) => {
          const trendColor = t.trendIsGood ? "text-good" : "text-bad";
          const trendChar = t.trend === "up" ? "↑" : "↓";
          return (
            <div key={t.label} className="rounded-2xl border border-line bg-ink-900/60 p-4 backdrop-blur-sm">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                {t.label}
              </div>
              <div className="mt-2 text-2xl font-bold text-white tabular-nums tracking-tight leading-none">
                {t.value}
              </div>
              <div className={`mt-1.5 text-xs ${trendColor} font-medium tabular-nums`}>
                {trendChar} {t.delta} <span className="text-slate-500 font-normal">vs last month</span>
              </div>
              <Sparkline trendIsGood={t.trendIsGood} />
            </div>
          );
        })}
      </div>

      {/* Decision Anchor - the AI-narrative panel */}
      <div className="lg:col-span-2 rounded-2xl border border-brand-purple/30 bg-gradient-to-br from-brand-purple/10 via-ink-900/60 to-brand-teal/5 p-5 backdrop-blur-sm flex flex-col">
        <div className="flex items-center gap-2 text-[11px] mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-purple anim-pulse-soft" />
          <span className="uppercase tracking-wider font-medium text-brand-purple">Decision Anchor</span>
        </div>
        <div className="text-sm text-slate-200 leading-relaxed">
          Your business is profitable and trending up. The main thing to watch is
          <span className="text-white font-semibold"> vendor concentration on Stripe Atlas</span> -
          a single line is now <span className="text-white font-semibold tabular-nums">14.2%</span> of expenses.
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Bullet label="Cash buffer healthy" tone="good" />
          <Bullet label="Margin recovering after April compression" tone="good" />
          <Bullet label="One vendor line worth reviewing" tone="warn" />
        </div>

        <button className="mt-auto self-start text-[11px] px-3 py-1.5 rounded-full border border-brand-purple/40 bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20 transition">
          Open Advisory →
        </button>
      </div>
    </div>
  );
}

function Bullet({ label, tone }: { label: string; tone: "good" | "warn" }) {
  const dot = tone === "good" ? "bg-good" : "bg-warn";
  return (
    <div className="flex items-center gap-2 text-xs text-slate-300">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </div>
  );
}
