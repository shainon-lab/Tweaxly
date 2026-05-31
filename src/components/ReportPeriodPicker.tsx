"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Granularity = "month" | "quarter" | "year";

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
  return String(y);
}

// Period picker for the Monthly report.
//   - Granularity: Month / Quarter / Year
//   - Period:      which month / quarter / year (anchor)
//   - Compare:     0 (default) | 1 | 2 | 3 prior periods of the same granularity
export default function ReportPeriodPicker({
  granularity,
  anchor,
  compare,
}: {
  granularity: Granularity;
  anchor: string;
  compare: number;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  // Optimistic local mirrors of the three URL-driven inputs. The
  // page is a Server Component, so changing a select fires a
  // navigation + DB query that can take a couple of seconds. Driving
  // the selects from URL props alone makes them look frozen on the
  // previous value during that window. Mirroring the choice locally
  // lets each select reflect the click instantly; we re-sync from
  // the prop after the navigation lands (also handles browser
  // back/forward). All downstream derivations (month / quarter /
  // year breakdowns) read the local draft, not the raw props, so
  // the cascade selects also update without waiting on the server.
  const [draftGran, setDraftGran]       = useState<Granularity>(granularity);
  const [draftAnchor, setDraftAnchor]   = useState<string>(anchor);
  const [draftCompare, setDraftCompare] = useState<number>(compare);
  useEffect(() => { setDraftGran(granularity); }, [granularity]);
  useEffect(() => { setDraftAnchor(anchor); },    [anchor]);
  useEffect(() => { setDraftCompare(compare); },  [compare]);

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
    // doesn't jump to "no period selected".
    const nextAnchor = defaultAnchor(g);
    setDraftGran(g);
    setDraftAnchor(nextAnchor);
    update({ gran: g, period: nextAnchor, compare: draftCompare ? String(draftCompare) : undefined });
  }

  function setPeriod(nextAnchor: string) {
    setDraftAnchor(nextAnchor);
    update({ period: nextAnchor });
  }

  // The "Period" selector adapts to the chosen granularity. We never show a
  // period later than today.
  const years = useMemo(() => {
    const out: number[] = [];
    for (let y = today.y; y >= MIN_YEAR; y--) out.push(y);
    return out;
  }, [today.y]);

  // Parse the *draft* (optimistic) anchor into pieces relevant to
  // the *draft* granularity. Using the drafts means the cascade
  // selects (Month + Year, Quarter + Year, Year) reflect a fresh
  // granularity switch instantly instead of waiting for the URL to
  // settle.
  let monthYear = today.y;
  let monthNum = today.m;
  let quarterYear = today.y;
  let quarterNum = Math.ceil(today.m / 3);
  let yearOnly = today.y;
  if (draftGran === "month") {
    const m = draftAnchor.match(/^(\d{4})-(\d{2})$/);
    if (m) { monthYear = Number(m[1]); monthNum = Number(m[2]); }
  } else if (draftGran === "quarter") {
    const m = draftAnchor.match(/^(\d{4})-Q([1-4])$/);
    if (m) { quarterYear = Number(m[1]); quarterNum = Number(m[2]); }
  } else {
    if (/^\d{4}$/.test(draftAnchor)) yearOnly = Number(draftAnchor);
  }

  // Allowed months / quarters when the year is the current year - can't pick
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
        <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">
          Granularity{pending ? <span aria-hidden className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse align-middle" /> : null}
        </label>
        <select
          className="input"
          value={draftGran}
          onChange={(e) => changeGranularity(e.target.value as Granularity)}
        >
          <option value="month">Month</option>
          <option value="quarter">Quarter</option>
          <option value="year">Year</option>
        </select>
      </div>

      {draftGran === "month" ? (
        <>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">Month</label>
            <select
              className="input"
              value={monthNum}
              onChange={(e) => setPeriod(`${monthYear}-${pad2(Number(e.target.value))}`)}
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
                setPeriod(`${newY}-${pad2(newM)}`);
              }}
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </>
      ) : null}

      {draftGran === "quarter" ? (
        <>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">Quarter</label>
            <select
              className="input"
              value={quarterNum}
              onChange={(e) => setPeriod(`${quarterYear}-${QUARTERS[Number(e.target.value) - 1]}`)}
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
                setPeriod(`${newY}-${QUARTERS[newQ - 1]}`);
              }}
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </>
      ) : null}

      {draftGran === "year" ? (
        <div>
          <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">Year</label>
          <select
            className="input"
            value={yearOnly}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      ) : null}

      <div>
        <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">Compare</label>
        <select
          className="input"
          value={draftCompare}
          onChange={(e) => {
            const v = Number(e.target.value);
            setDraftCompare(v);
            update({ compare: v === 0 ? undefined : String(v) });
          }}
        >
          <option value="0">No comparison</option>
          <option value="1">vs prior 1 {draftGran}</option>
          <option value="2">vs prior 2 {draftGran}s</option>
          <option value="3">vs prior 3 {draftGran}s</option>
        </select>
      </div>
    </div>
  );
}
