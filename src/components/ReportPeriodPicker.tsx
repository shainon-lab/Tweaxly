"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Granularity = "month" | "quarter" | "year" | "all" | "custom";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;

const MIN_YEAR = 2020;

function pad2(n: number) { return String(n).padStart(2, "0"); }

function defaultAnchor(g: Granularity): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  if (g === "month") return `${y}-${pad2(m)}`;
  if (g === "quarter") return `${y}-${QUARTERS[Math.ceil(m / 3) - 1]}`;
  if (g === "year") return String(y);
  return ""; // all / custom have no anchor
}

function thisYM(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
}

// Period picker for the Reports page.
//   - View:        Comparison (period vs prior periods) | Category Grid
//                  (one row per category × one column per month in window)
//   - Granularity: Month / Quarter / Year
//   - Period:      which month / quarter / year (anchor)
//   - Compare:     0 (default) | 1 | 2 | 3 prior periods of the same
//                  granularity. Only meaningful in the Comparison view.
export default function ReportPeriodPicker({
  granularity,
  anchor,
  compare,
  view,
  start,
  end,
}: {
  granularity: Granularity;
  anchor: string;
  compare: number;
  view: "comparison" | "grid";
  start?: string;
  end?: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [draftStart, setDraftStart] = useState(start || thisYM());
  const [draftEnd, setDraftEnd] = useState(end || thisYM());

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
    startTransition(() => router.push(`/report?${params.toString()}`));
  }

  function changeGranularity(g: Granularity) {
    // Pick a sensible default anchor for the new granularity so the form
    // doesn't jump to "no period selected". All time / Custom have no
    // anchor and force compare=0 since there's no prior period to shift to.
    if (g === "all") {
      update({ gran: "all", period: undefined, compare: undefined, start: undefined, end: undefined });
      return;
    }
    if (g === "custom") {
      update({ gran: "custom", period: undefined, compare: undefined, start: draftStart, end: draftEnd });
      return;
    }
    update({ gran: g, period: defaultAnchor(g), compare: compare ? String(compare) : undefined, start: undefined, end: undefined });
  }

  function applyCustom() {
    if (!draftStart || !draftEnd) return;
    const a = draftStart <= draftEnd ? draftStart : draftEnd;
    const b = draftStart <= draftEnd ? draftEnd : draftStart;
    update({ gran: "custom", start: a, end: b, period: undefined, compare: undefined });
  }

  // The "Period" selector adapts to the chosen granularity. We never show a
  // period later than today.
  const years = useMemo(() => {
    const out: number[] = [];
    for (let y = today.y; y >= MIN_YEAR; y--) out.push(y);
    return out;
  }, [today.y]);

  // Parse current anchor into pieces relevant to the granularity.
  let monthYear = today.y;
  let monthNum = today.m;
  let quarterYear = today.y;
  let quarterNum = Math.ceil(today.m / 3);
  let yearOnly = today.y;
  if (granularity === "month") {
    const m = anchor.match(/^(\d{4})-(\d{2})$/);
    if (m) { monthYear = Number(m[1]); monthNum = Number(m[2]); }
  } else if (granularity === "quarter") {
    const m = anchor.match(/^(\d{4})-Q([1-4])$/);
    if (m) { quarterYear = Number(m[1]); quarterNum = Number(m[2]); }
  } else {
    if (/^\d{4}$/.test(anchor)) yearOnly = Number(anchor);
  }

  // Allowed months / quarters when the year is the current year — can't pick
  // future periods.
  const monthsForYear = useMemo(() => {
    const max = monthYear >= today.y ? today.m : 12;
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [monthYear, today]);
  const quartersForYear = useMemo(() => {
    const maxQ = quarterYear >= today.y ? Math.ceil(today.m / 3) : 4;
    return Array.from({ length: maxQ }, (_, i) => i + 1);
  }, [quarterYear, today]);

  return (
    <div className="flex items-end gap-2 flex-wrap justify-end">
      <div>
        <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">View</label>
        <select
          className="input"
          value={view}
          onChange={(e) => update({ view: e.target.value === "grid" ? "grid" : undefined })}
          disabled={pending}
        >
          <option value="comparison">P&amp;L</option>
          <option value="grid">Detail</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">Period</label>
        <select
          className="input"
          value={granularity}
          onChange={(e) => changeGranularity(e.target.value as Granularity)}
          disabled={pending}
        >
          <option value="month">Month</option>
          <option value="quarter">Quarter</option>
          <option value="year">Year</option>
          <option value="all">All time</option>
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
              onChange={(e) => update({ period: `${monthYear}-${pad2(Number(e.target.value))}` })}
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
                update({ period: `${newY}-${pad2(newM)}` });
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
              onChange={(e) => update({ period: `${quarterYear}-${QUARTERS[Number(e.target.value) - 1]}` })}
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
                update({ period: `${newY}-${QUARTERS[newQ - 1]}` });
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
            onChange={(e) => update({ period: e.target.value })}
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
              type="month"
              className="input"
              value={draftStart}
              max={draftEnd || undefined}
              onChange={(e) => setDraftStart(e.target.value)}
              disabled={pending}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">To</label>
            <input
              type="month"
              className="input"
              value={draftEnd}
              min={draftStart || undefined}
              onChange={(e) => setDraftEnd(e.target.value)}
              disabled={pending}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1 opacity-0">Apply</label>
            <button
              type="button"
              className="btn-primary"
              onClick={applyCustom}
              disabled={pending || !draftStart || !draftEnd}
            >
              Apply
            </button>
          </div>
        </>
      ) : null}

      {view === "comparison" && (granularity === "month" || granularity === "quarter" || granularity === "year") ? (
        <div>
          <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">Compare</label>
          <select
            className="input"
            value={compare}
            onChange={(e) => update({ compare: e.target.value === "0" ? undefined : e.target.value })}
            disabled={pending}
          >
            <option value="0">No comparison</option>
            <option value="1">vs prior 1 {granularity}</option>
            <option value="2">vs prior 2 {granularity}s</option>
            <option value="3">vs prior 3 {granularity}s</option>
          </select>
        </div>
      ) : null}
    </div>
  );
}
