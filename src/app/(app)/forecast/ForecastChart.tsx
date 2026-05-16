"use client";

// Forecast chart — baseline vs scenario over time. Lets the user toggle which
// metric (revenue / expenses / net / cashflow) is plotted. Cashflow is the
// cumulative scenario net.

import { useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, Legend, CartesianGrid,
} from "recharts";
import { fmtMoney } from "@/lib/format";

type Point = {
  ym: string;
  index: number;
  baselineRevenue: number;
  baselineExpenses: number;
  baselineNet: number;
  scenarioRevenue: number;
  scenarioExpenses: number;
  scenarioNet: number;
};

type Metric = "revenue" | "expenses" | "net" | "cashflow";

const METRIC_LABEL: Record<Metric, string> = {
  revenue:   "Revenue",
  expenses:  "Expenses",
  net:       "Net profit",
  cashflow:  "Cumulative cashflow",
};

function fmtCompact(v: number): string {
  if (!isFinite(v)) return "—";
  const sign = v < 0 ? "−" : "";
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

export default function ForecastChart({
  points,
  showScenario = true,
}: {
  points: Point[];
  // When false, render only the baseline line — used on Forecast →
  // Overview where the projection is intentionally passive and
  // shouldn't display a scenario comparison.
  showScenario?: boolean;
}) {
  const [metric, setMetric] = useState<Metric>("net");

  const data = useMemo(() => {
    if (metric === "cashflow") {
      let bCum = 0;
      let sCum = 0;
      return points.map((p) => {
        bCum += p.baselineNet;
        sCum += p.scenarioNet;
        return { ym: p.ym, baseline: bCum, scenario: sCum };
      });
    }
    return points.map((p) => {
      switch (metric) {
        case "revenue":
          return { ym: p.ym, baseline: p.baselineRevenue, scenario: p.scenarioRevenue };
        case "expenses":
          return { ym: p.ym, baseline: p.baselineExpenses, scenario: p.scenarioExpenses };
        case "net":
        default:
          return { ym: p.ym, baseline: p.baselineNet, scenario: p.scenarioNet };
      }
    });
  }, [points, metric]);

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="font-medium">
          {showScenario ? "Baseline vs scenario" : "Forecast trajectory"}
        </div>
        <div className="flex items-center gap-1">
          {(Object.keys(METRIC_LABEL) as Metric[]).map((m) => (
            <button
              key={m}
              type="button"
              className={`text-xs px-3 py-1 rounded-md border transition ${
                m === metric
                  ? "bg-accent-soft border-accent text-accent"
                  : "border-line text-slate-300 hover:bg-ink-700"
              }`}
              onClick={() => setMetric(m)}
            >
              {METRIC_LABEL[m]}
            </button>
          ))}
        </div>
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#272c3a" strokeDasharray="3 3" />
            <XAxis dataKey="ym" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => fmtCompact(v)} />
            <Tooltip formatter={(v: number) => fmtMoney(v)} />
            <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="baseline"
              name={showScenario ? "Baseline" : "Projection"}
              stroke={showScenario ? "#94a3b8" : "#5b8def"}
              strokeWidth={showScenario ? 2 : 2.5}
              dot={{ r: showScenario ? 2 : 3 }}
            />
            {showScenario ? (
              <Line type="monotone" dataKey="scenario" name="Scenario" stroke="#5b8def" strokeWidth={2.5} dot={{ r: 3 }} />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="text-xs text-slate-500 mt-2">
        {showScenario
          ? "Baseline = trend-extrapolated from history. Scenario = baseline + the active assumptions."
          : "Projection = trend-extrapolated from your historical activity, with no scenario assumptions applied."}
      </div>
    </div>
  );
}
