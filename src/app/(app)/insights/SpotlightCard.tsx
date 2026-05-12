"use client";
import type { SpotlightInsight } from "@/lib/spotlightInsights";
import { TrendChart, CategoryBars, CashflowChart } from "@/components/Charts";

// Tiny **bold** renderer so spotlight bodies can highlight key terms without
// pulling in a full markdown library.
function renderBody(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i} className="text-slate-100">{p.slice(2, -2)}</strong>;
    }
    return <span key={i}>{p}</span>;
  });
}

export default function SpotlightCard({ insight }: { insight: SpotlightInsight }) {
  return (
    <div className="card">
      <div className="font-medium text-base mb-1">{insight.headline}</div>
      <div className="text-sm text-slate-400 mb-4">{renderBody(insight.body)}</div>
      <Chart insight={insight} />
    </div>
  );
}

function Chart({ insight }: { insight: SpotlightInsight }) {
  switch (insight.chart.kind) {
    case "trend":
      return <TrendChart data={insight.chart.data} />;
    case "categoryBars":
      return <CategoryBars data={insight.chart.data} />;
    case "cashflow":
      return <CashflowChart data={insight.chart.data} />;
  }
}
