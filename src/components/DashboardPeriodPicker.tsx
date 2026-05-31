"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type Range =
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "last_quarter"
  | "this_year"
  | "last_year"
  | "custom";

type Compare = "none" | "previous" | "last_year" | "two_years_ago";

const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "this_quarter", label: "This quarter" },
  { value: "last_quarter", label: "Last quarter" },
  { value: "this_year", label: "This year" },
  { value: "last_year", label: "Last year" },
  { value: "custom", label: "Custom" },
];

// Labels shown in the "Compare to" dropdown depend on the primary range so the
// option text reads naturally - e.g. "Last quarter" when primary = This quarter,
// "Same month last year" when primary = This month, etc.
function compareOptionsFor(range: Range): { value: Compare; label: string }[] {
  let previousLbl: string;
  let lastYearLbl: string;
  let twoYearsLbl: string;
  switch (range) {
    case "this_month":
      previousLbl  = "Last month";
      lastYearLbl  = "This month, last year";
      twoYearsLbl  = "This month, 2 years ago";
      break;
    case "last_month":
      previousLbl  = "Two months ago";
      lastYearLbl  = "Same month last year";
      twoYearsLbl  = "Same month, 2 years ago";
      break;
    case "this_quarter":
      previousLbl  = "Last quarter";
      lastYearLbl  = "This quarter, last year";
      twoYearsLbl  = "This quarter, 2 years ago";
      break;
    case "last_quarter":
      previousLbl  = "Quarter before";
      lastYearLbl  = "Same quarter last year";
      twoYearsLbl  = "Same quarter, 2 years ago";
      break;
    case "this_year":
      previousLbl  = "Last year";
      lastYearLbl  = "Two years ago";
      twoYearsLbl  = "Three years ago";
      break;
    case "last_year":
      previousLbl  = "Two years ago";
      lastYearLbl  = "Three years ago";
      twoYearsLbl  = "Four years ago";
      break;
    case "custom":
    default:
      previousLbl  = "Previous period";
      lastYearLbl  = "Same period last year";
      twoYearsLbl  = "Same period, 2 years ago";
  }
  return [
    { value: "none",          label: "No comparison" },
    { value: "previous",      label: previousLbl },
    { value: "last_year",     label: lastYearLbl },
    { value: "two_years_ago", label: twoYearsLbl },
  ];
}

export default function DashboardPeriodPicker({
  range,
  start,
  end,
  compare = "none",
  controls = "all",
}: {
  range: Range;
  start: string;
  end: string;
  compare?: Compare;
  // Which sub-controls to render. "period" → range + custom dates only
  // (the dashboard header). "compare" → just the comparison dropdown
  // (placed above the stat tiles). "all" preserves the legacy layout.
  controls?: "all" | "period" | "compare";
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [draftStart, setDraftStart] = useState(start);
  const [draftEnd, setDraftEnd] = useState(end);

  // Optimistic local state for the two main selects. The page is a
  // Server Component, so changing a select fires a navigation + DB
  // aggregation that can take a couple of seconds. Driving the
  // select's `value` from the URL prop alone makes the select look
  // frozen during that window. Mirroring the choice locally lets the
  // select reflect the click instantly while the server work runs
  // underneath. We re-sync from the prop after the navigation lands
  // (also covers browser back/forward).
  const [draftRange, setDraftRange] = useState<Range>(range);
  const [draftCompare, setDraftCompare] = useState<Compare>(compare);
  useEffect(() => { setDraftRange(range); },     [range]);
  useEffect(() => { setDraftCompare(compare); }, [compare]);

  function update(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === "") params.delete(k);
      else params.set(k, v);
    }
    startTransition(() => router.push(`/dashboard?${params.toString()}`));
  }

  function applyCustom() {
    if (!draftStart || !draftEnd) return;
    update({ range: "custom", start: draftStart, end: draftEnd });
  }

  const showPeriod = controls === "all" || controls === "period";
  const showCompare = controls === "all" || controls === "compare";

  return (
    // Label-above-input per group, groups laid out left-to-right with
    // items-end so the controls line up at the bottom even when one
    // group has a stacked label and another expands.
    <div className="flex items-end gap-3 flex-wrap justify-end">
      {showPeriod ? (
        <div>
          <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">
            Period{pending ? <span aria-hidden className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse align-middle" /> : null}
          </label>
          <select
            className="input"
            value={draftRange}
            onChange={(e) => {
              const v = e.target.value as Range;
              setDraftRange(v);
              if (v === "custom") {
                update({ range: v, start: draftStart, end: draftEnd });
              } else {
                update({ range: v, start: undefined, end: undefined });
              }
            }}
          >
            {RANGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {showCompare ? (
        <div>
          <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">
            Compare to{pending ? <span aria-hidden className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse align-middle" /> : null}
          </label>
          <select
            className="input"
            value={draftCompare}
            onChange={(e) => {
              const v = e.target.value as Compare;
              setDraftCompare(v);
              update({ compare: v === "none" ? undefined : v });
            }}
          >
            {compareOptionsFor(draftRange).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {showPeriod && range === "custom" ? (
        <>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">From</label>
            <input
              type="date"
              className="input"
              value={draftStart}
              onChange={(e) => setDraftStart(e.target.value)}
              disabled={pending}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">To</label>
            <input
              type="date"
              className="input"
              value={draftEnd}
              onChange={(e) => setDraftEnd(e.target.value)}
              disabled={pending}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1 opacity-0">Apply</label>
            <button
              type="button"
              className="btn-primary"
              disabled={pending || !draftStart || !draftEnd}
              onClick={applyCustom}
            >
              Apply
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
