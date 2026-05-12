"use client";
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis,
  Tooltip, Legend, CartesianGrid,
  LabelList,
} from "recharts";
import { fmtMoney } from "@/lib/format";

// Tooltip formatter that fully spells out a number with comma thousands
// separators and two decimals — used by all chart hover tooltips so the
// popup is always readable and matches the rest of the app's money format.
const tooltipFmt = (value: number) => fmtMoney(value);

// Compact money formatter for inline data labels on charts. Avoids overflowing
// the bar/point. Caps at 2 decimals to match the rest of the app.
function fmtCompact(v: number): string {
  if (!isFinite(v)) return "—";
  const sign = v < 0 ? "−" : "";
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${sign}$${trim2(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `${sign}$${trim2(abs / 1_000)}k`;
  return `${sign}$${trim2(abs)}`;
}

function trim2(n: number): string {
  // Up to 2 decimals, no trailing zeros.
  return (Math.round(n * 100) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

// "Nice" tick generator: ticks at multiples of 10^(digits-1) of the data's
// magnitude. e.g. data up to 300,000 → ticks at 0, 100k, 200k, 300k.
// Data up to 45,000 → ticks at 0, 10k, 20k, 30k, 40k, 50k. Handles negative
// values by extending downward symmetrically.
function niceMoneyTicks(values: number[]): { ticks: number[]; domain: [number, number] } {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return { ticks: [0], domain: [0, 0] };
  const minV = Math.min(0, ...finite);
  const maxV = Math.max(0, ...finite);
  const span = Math.max(Math.abs(minV), Math.abs(maxV));
  if (span === 0) return { ticks: [0], domain: [0, 0] };
  // Step = 10^(floor(log10(span))). For 300k (5.477 digits) → 100k step.
  const step = Math.pow(10, Math.floor(Math.log10(span)));
  const niceMax = Math.ceil(maxV / step) * step;
  const niceMin = Math.floor(minV / step) * step;
  const ticks: number[] = [];
  // Cap iterations defensively in case of bad data.
  for (let v = niceMin, guard = 0; v <= niceMax && guard < 50; v += step, guard++) {
    ticks.push(Math.round(v / step) * step); // snap away float drift
  }
  return { ticks, domain: [niceMin, niceMax] };
}

const LABEL_STYLE = { fill: "#cbd5e1", fontSize: 11 };

export function TrendChart({
  data,
}: {
  data: { ym: string; income: number; expenses: number; net: number }[];
}) {
  const allValues = data.flatMap((d) => [d.income, d.expenses, d.net]);
  const { ticks, domain } = niceMoneyTicks(allValues);
  return (
    <div className="h-96 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#272c3a" strokeDasharray="3 3" />
          <XAxis dataKey="ym" stroke="#94a3b8" fontSize={12} />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            ticks={ticks}
            domain={domain}
            interval={0}
            tickFormatter={(v) => fmtCompact(v)}
          />
          <Tooltip formatter={(v: number) => tooltipFmt(v)} />
          <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
          <Line type="monotone" dataKey="income" stroke="#3ecf8e" strokeWidth={2} dot={{ r: 3 }}>
            <LabelList dataKey="income" position="top" formatter={(v: number) => fmtCompact(v)} {...LABEL_STYLE} />
          </Line>
          <Line type="monotone" dataKey="expenses" stroke="#ef5b5b" strokeWidth={2} dot={{ r: 3 }}>
            <LabelList dataKey="expenses" position="bottom" formatter={(v: number) => fmtCompact(v)} {...LABEL_STYLE} />
          </Line>
          <Line type="monotone" dataKey="net" stroke="#5b8def" strokeWidth={2} dot={{ r: 3 }}>
            <LabelList dataKey="net" position="top" formatter={(v: number) => fmtCompact(v)} {...LABEL_STYLE} />
          </Line>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryBars({
  data,
}: {
  data: { name: string; amount: number }[];
}) {
  const { ticks, domain } = niceMoneyTicks(data.map((d) => d.amount));
  // Scale height with row count so each bar gets enough vertical space even
  // when the chart sits in a narrow card.
  const rowH = 38;
  const minH = 288;
  const height = Math.max(minH, data.length * rowH + 56);
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 96, left: 12, bottom: 0 }}>
          <CartesianGrid stroke="#272c3a" strokeDasharray="3 3" />
          <XAxis
            type="number"
            stroke="#94a3b8"
            fontSize={12}
            ticks={ticks}
            domain={domain}
            interval={0}
            tickFormatter={(v) => fmtCompact(v)}
          />
          <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={180} />
          <Tooltip formatter={(v: number) => tooltipFmt(v)} />
          <Bar dataKey="amount" fill="#5b8def" radius={[0, 4, 4, 0]}>
            <LabelList dataKey="amount" position="right" formatter={(v: number) => fmtCompact(v)} {...LABEL_STYLE} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CashflowChart({
  data,
}: {
  data: { ym: string; net: number }[];
}) {
  const { ticks, domain } = niceMoneyTicks(data.map((d) => d.net));
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#272c3a" strokeDasharray="3 3" />
          <XAxis dataKey="ym" stroke="#94a3b8" fontSize={12} />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            ticks={ticks}
            domain={domain}
            interval={0}
            tickFormatter={(v) => fmtCompact(v)}
          />
          <Tooltip formatter={(v: number) => tooltipFmt(v)} />
          <Bar dataKey="net" fill="#5b8def" radius={[4, 4, 0, 0]}>
            <LabelList dataKey="net" position="top" formatter={(v: number) => fmtCompact(v)} {...LABEL_STYLE} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
