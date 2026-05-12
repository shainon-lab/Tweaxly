"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

// Insights period picker: Last 6 months / Monthly / Quarterly / Yearly /
// Custom. "Last 6 months" is the default and needs no extra inputs (it's a
// fixed window anchored at the latest data month). "Custom" exposes a
// calendar date range (From / To) that the user applies once they've picked
// both dates.
type Granularity = "trailing6" | "month" | "quarter" | "year" | "custom";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;
const MIN_YEAR = 2020;

function pad2(n: number) { return String(n).padStart(2, "0"); }

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardInsightsPicker({
  granularity,
  anchor,
  from,
  to,
}: {
  granularity: Granularity;
  anchor: string;
  from?: string; // YYYY-MM-DD when granularity = "custom"
  to?: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  // Local drafts so the user can pick both dates before pushing to the URL.
  const [draftFrom, setDraftFrom] = useState(from || todayISODate());
  const [draftTo, setDraftTo] = useState(to || todayISODate());

  const today = useMemo(() => {
    const d = new Date();
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 };
  }, []);

  function update(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === "") params.delete(k);
      else params.set(k, v);
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  const years = useMemo(() => {
    const out: number[] = [];
    for (let y = today.y; y >= MIN_YEAR; y--) out.push(y);
    return out;
  }, [today.y]);

  let monthYear = today.y, monthNum = today.m;
  let quarterYear = today.y, quarterNum = Math.ceil(today.m / 3);
  let yearOnly = today.y;
  if (granularity === "month") {
    const m = anchor.match(/^(\d{4})-(\d{2})$/);
    if (m) { monthYear = Number(m[1]); monthNum = Number(m[2]); }
  } else if (granularity === "quarter") {
    const m = anchor.match(/^(\d{4})-Q([1-4])$/);
    if (m) { quarterYear = Number(m[1]); quarterNum = Number(m[2]); }
  } else if (granularity === "year") {
    if (/^\d{4}$/.test(anchor)) yearOnly = Number(anchor);
  }

  const monthsForYear = useMemo(() => {
    const max = monthYear >= today.y ? today.m : 12;
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [monthYear, today]);
  const quartersForYear = useMemo(() => {
    const maxQ = quarterYear >= today.y ? Math.ceil(today.m / 3) : 4;
    return Array.from({ length: maxQ }, (_, i) => i + 1);
  }, [quarterYear, today]);

  function changeGranularity(g: Granularity) {
    const d = new Date();
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    if (g === "custom") {
      // Don't navigate yet — wait for the user to set both dates and click Apply.
      update({
        insights_gran: "custom",
        insights_period: undefined,
        insights_from: draftFrom,
        insights_to: draftTo,
      });
      return;
    }
    if (g === "trailing6") {
      update({
        insights_gran: "trailing6",
        insights_period: undefined,
        insights_from: undefined,
        insights_to: undefined,
      });
      return;
    }
    const defAnchor =
      g === "month"   ? `${y}-${pad2(m)}` :
      g === "quarter" ? `${y}-Q${Math.ceil(m / 3)}` :
                        String(y);
    update({
      insights_gran: g,
      insights_period: defAnchor,
      insights_from: undefined,
      insights_to: undefined,
    });
  }

  function applyCustom() {
    if (!draftFrom || !draftTo) return;
    // Always normalize so from ≤ to.
    const a = draftFrom <= draftTo ? draftFrom : draftTo;
    const b = draftFrom <= draftTo ? draftTo : draftFrom;
    update({
      insights_gran: "custom",
      insights_period: undefined,
      insights_from: a,
      insights_to: b,
    });
  }

  return (
    <div className="flex items-end gap-2 flex-wrap">
      <div>
        <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">
          Period
        </label>
        <select
          className="input"
          value={granularity}
          onChange={(e) => changeGranularity(e.target.value as Granularity)}
          disabled={pending}
        >
          <option value="trailing6">Last 6 months</option>
          <option value="month">Monthly</option>
          <option value="quarter">Quarterly</option>
          <option value="year">Yearly</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {granularity === "month" ? (
        <>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">Month</label>
            <select
              className="input"
              value={monthNum}
              onChange={(e) => update({ insights_period: `${monthYear}-${pad2(Number(e.target.value))}` })}
              disabled={pending}
            >
              {monthsForYear.map((m) => <option key={m} value={m}>{MONTH_NAMES[m - 1]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">Year</label>
            <select
              className="input"
              value={monthYear}
              onChange={(e) => {
                const newY = Number(e.target.value);
                const newM = newY === today.y && monthNum > today.m ? today.m : monthNum;
                update({ insights_period: `${newY}-${pad2(newM)}` });
              }}
              disabled={pending}
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </>
      ) : null}

      {granularity === "quarter" ? (
        <>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">Quarter</label>
            <select
              className="input"
              value={quarterNum}
              onChange={(e) => update({ insights_period: `${quarterYear}-${QUARTERS[Number(e.target.value) - 1]}` })}
              disabled={pending}
            >
              {quartersForYear.map((q) => <option key={q} value={q}>{QUARTERS[q - 1]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">Year</label>
            <select
              className="input"
              value={quarterYear}
              onChange={(e) => {
                const newY = Number(e.target.value);
                const maxQ = newY === today.y ? Math.ceil(today.m / 3) : 4;
                const newQ = Math.min(quarterNum, maxQ);
                update({ insights_period: `${newY}-${QUARTERS[newQ - 1]}` });
              }}
              disabled={pending}
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </>
      ) : null}

      {granularity === "year" ? (
        <div>
          <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">Year</label>
          <select
            className="input"
            value={yearOnly}
            onChange={(e) => update({ insights_period: e.target.value })}
            disabled={pending}
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      ) : null}

      {granularity === "custom" ? (
        <>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">From</label>
            <input
              type="date"
              className="input"
              value={draftFrom}
              max={draftTo || undefined}
              onChange={(e) => setDraftFrom(e.target.value)}
              disabled={pending}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">To</label>
            <input
              type="date"
              className="input"
              value={draftTo}
              min={draftFrom || undefined}
              onChange={(e) => setDraftTo(e.target.value)}
              disabled={pending}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1 opacity-0">Apply</label>
            <button
              type="button"
              className="btn-primary"
              onClick={applyCustom}
              disabled={pending || !draftFrom || !draftTo}
            >
              Apply
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
