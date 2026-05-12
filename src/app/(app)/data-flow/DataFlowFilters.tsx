"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

// Same horizontal layout as ReportPeriodPicker: each label sits above its
// select, all controls flow left-to-right in a wrapping flex row.
export default function DataFlowFilters({
  range,
  category,
  view,
  start,
  end,
  allCategories,
}: {
  range: string;
  category: string;
  view: string;
  start: string;
  end: string;
  allCategories: string[];
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
    startTransition(() => router.push(`/data-flow?${params.toString()}`));
  }

  function applyCustom() {
    if (!draftStart || !draftEnd) return;
    update({ range: "custom", start: draftStart, end: draftEnd });
  }

  return (
    <div className="flex items-end gap-2 flex-wrap justify-end">
      <div>
        <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">View</label>
        <select
          className="input"
          value={view}
          onChange={(e) => update({ view: e.target.value })}
          disabled={pending}
        >
          <option value="summary">P&amp;L summary</option>
          <option value="detail">Per-month detail</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">Period</label>
        <select
          className="input"
          value={range}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "custom") {
              update({ range: v, start: draftStart, end: draftEnd });
            } else {
              update({ range: v, start: undefined, end: undefined });
            }
          }}
          disabled={pending}
        >
          <option value="all">All time</option>
          <option value="this_month">This month</option>
          <option value="last_month">Last month</option>
          <option value="this_quarter">This quarter</option>
          <option value="last_quarter">Last quarter</option>
          <option value="this_year">This year</option>
          <option value="last_year">Last year</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      {range === "custom" ? (
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
              className="btn-primary"
              disabled={pending || !draftStart || !draftEnd}
              onClick={applyCustom}
            >
              Apply
            </button>
          </div>
        </>
      ) : null}
      <div>
        <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">Category</label>
        <select
          className="input"
          value={category}
          onChange={(e) => update({ category: e.target.value })}
          disabled={pending}
        >
          <option value="__all__">All categories</option>
          {allCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
