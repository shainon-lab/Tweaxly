// Native SVG mockup of the product's Forecast workspace - a small
// revenue curve with a solid history segment, a dashed forecast
// segment, and a lighter scenario overlay. Designed to read at a
// glance ("you can see where you're heading") rather than as a real
// chart.

export function ForecastChart() {
  // 12 monthly buckets - first 7 are 'actuals', last 5 are 'forecast'
  // with a higher 'scenario' overlay.
  const W = 640;
  const H = 240;
  const padL = 36;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  // y values 0..1 (will be scaled to innerH)
  const actuals  = [0.28, 0.34, 0.31, 0.42, 0.48, 0.52, 0.58];
  const forecast = [0.58, 0.61, 0.63, 0.66, 0.70];
  const scenario = [0.58, 0.66, 0.74, 0.81, 0.88];
  const all = [...actuals, ...forecast.slice(1)]; // continuous baseline
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function x(i: number) { return padL + (i / (months.length - 1)) * innerW; }
  function y(v: number) { return padT + (1 - v) * innerH; }

  // Actual path
  const actualPath = actuals.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
  // Forecast path (continues from index 6)
  const forecastPath = forecast.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i + 6)} ${y(v)}`).join(" ");
  // Scenario path (continues from index 6, higher trajectory)
  const scenarioPath = scenario.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i + 6)} ${y(v)}`).join(" ");
  // Filled area under the actuals (gradient)
  const actualArea = `${actualPath} L ${x(6)} ${y(0)} L ${x(0)} ${y(0)} Z`;
  void all;

  return (
    <div className="glass product-dark p-5 sm:p-6">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-purple anim-pulse-soft" />
            <span className="uppercase tracking-wider font-medium text-slate-300">Forecast</span>
            <span className="text-slate-600">·</span>
            <span>12-month outlook</span>
          </div>
          <div className="text-lg font-semibold text-slate-50">Projected Net Profit</div>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <Legend dot="bg-slate-200" label="Actual" />
          <Legend dot="bg-brand-purple" label="Forecast" dashed />
          <Legend dot="bg-brand-teal" label="+ Hire 2 engineers" dashed />
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Forecast chart">
        <defs>
          <linearGradient id="actualFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineStroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#e7eaf0" />
          </linearGradient>
        </defs>

        {/* Y gridlines */}
        {[0.25, 0.5, 0.75, 1].map((g, i) => (
          <line
            key={i}
            x1={padL} x2={W - padR}
            y1={y(g)} y2={y(g)}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
        ))}

        {/* Actual area fill */}
        <path d={actualArea} fill="url(#actualFill)" />

        {/* Vertical divider between actual + forecast */}
        <line
          x1={x(6)} x2={x(6)}
          y1={padT} y2={H - padB}
          stroke="rgba(167,139,250,0.25)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <text
          x={x(6) + 6} y={padT + 12}
          fill="rgba(167,139,250,0.8)"
          fontSize="9"
          letterSpacing="0.12em"
        >
          NOW
        </text>

        {/* Actual line */}
        <path d={actualPath} fill="none" stroke="url(#lineStroke)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Scenario (teal, dashed) - drawn first so forecast sits on top */}
        <path d={scenarioPath} fill="none" stroke="#22d3ee" strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />

        {/* Forecast (purple, dashed) */}
        <path d={forecastPath} fill="none" stroke="#a78bfa" strokeWidth="2.25" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" />

        {/* End-point dots */}
        <circle cx={x(actuals.length - 1)} cy={y(actuals[actuals.length - 1])} r="3.5" fill="#e7eaf0" />
        <circle cx={x(months.length - 1)} cy={y(forecast[forecast.length - 1])} r="3.5" fill="#a78bfa" />
        <circle cx={x(months.length - 1)} cy={y(scenario[scenario.length - 1])} r="3.5" fill="#22d3ee" />

        {/* X axis labels */}
        {months.map((m, i) => (
          <text
            key={i}
            x={x(i)} y={H - 8}
            fill="rgba(203,213,225,0.45)"
            fontSize="10"
            textAnchor="middle"
          >
            {m}
          </text>
        ))}
      </svg>

      <div className="mt-4 flex items-center justify-between text-xs flex-wrap gap-2">
        <div className="text-slate-400">
          Baseline ends at <span className="text-slate-100 font-semibold tabular-nums">$58.4K</span> · Scenario adds <span className="text-brand-teal font-semibold tabular-nums">+$23.1K</span>
        </div>
        <button className="text-[11px] px-3 py-1.5 rounded-full border border-brand-purple/40 bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20 transition">
          Add scenario
        </button>
      </div>
    </div>
  );
}

function Legend({ dot, label, dashed }: { dot: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-slate-400">
      <span className={`w-3 h-0.5 ${dot} ${dashed ? "opacity-70" : ""}`} />
      {label}
    </span>
  );
}
