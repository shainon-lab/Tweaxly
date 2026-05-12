"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

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
// option text reads naturally — e.g. "Last quarter" when primary = This quarter,
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
}: {
  range: Range;
  start: string;
  end: string;
  compare?: Compare;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [draftStart, setDraftStart] = useState(start);
  const [draftEnd, setDraftEnd] = useState(end);

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

  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      <label className="text-xs uppercase tracking-wide text-slate-400">Period</label>
      <select
        className="input"
        value={range}
        onChange={(e) => {
          const v = e.target.value as Range;
          if (v === "custom") {
            update({ range: v, start: draftStart, end: draftEnd });
          } else {
            update({ range: v, start: undefined, end: undefined });
          }
        }}
        disabled={pending}
      >
        {RANGE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <label className="text-xs uppercase tracking-wide text-slate-400 ml-2">
        Compare to
      </label>
      <select
        className="input"
        value={compare}
        onChange={(e) => update({ compare: e.target.value === "none" ? undefined : e.target.value })}
        disabled={pending}
      >
        {compareOptionsFor(range).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {range === "custom" ? (
        <>
          <label className="text-xs uppercase tracking-wide text-slate-400 ml-1">From</label>
          <input
            type="date"
            className="input"
            value={draftStart}
            onChange={(e) => setDraftStart(e.target.value)}
            disabled={pending}
          />
          <label className="text-xs uppercase tracking-wide text-slate-400">To</label>
          <input
            type="date"
            className="input"
            value={draftEnd}
            onChange={(e) => setDraftEnd(e.target.value)}
            disabled={pending}
          />
          <button
            className="btn-primary"
            disabled={pending || !draftStart || !draftEnd}
            onClick={applyCustom}
          >
            Apply
          </button>
        </>
      ) : null}
    </div>
  );
}
