"use client";

// The setup row at the top of the Forecast tab — historical period selector
// and forecast horizon selector, both URL-driven. Custom historical range
// exposes from/to month inputs.

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const HISTORICAL_OPTIONS = [
  { value: "3m",        label: "Last 3 months" },
  { value: "6m",        label: "Last 6 months" },
  { value: "12m",       label: "Last 12 months" },
  { value: "ytd",       label: "Year to date" },
  { value: "last_year", label: "Last year" },
  { value: "custom",    label: "Custom range" },
] as const;

const HORIZON_OPTIONS = [
  { value: "3m",  label: "Next 3 months" },
  { value: "6m",  label: "Next 6 months" },
  { value: "12m", label: "Next 12 months" },
  { value: "24m", label: "Next 24 months" },
  { value: "36m", label: "Next 36 months" },
  { value: "60m", label: "Next 60 months" },
] as const;

function thisYM() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default function ForecastSetup({
  historical,
  horizon,
  histFrom,
  histTo,
}: {
  historical: string;
  horizon: string;
  histFrom?: string;
  histTo?: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [draftFrom, setDraftFrom] = useState(histFrom || thisYM());
  const [draftTo, setDraftTo] = useState(histTo || thisYM());

  function update(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === "") params.delete(k);
      else params.set(k, v);
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function applyCustom() {
    if (!draftFrom || !draftTo) return;
    const a = draftFrom <= draftTo ? draftFrom : draftTo;
    const b = draftFrom <= draftTo ? draftTo : draftFrom;
    update({ historical: "custom", hist_from: a, hist_to: b });
  }

  return (
    // Compact inline filter cluster — designed to live in the
    // PageHeader's `right` slot. Used to be a full-width card; now
    // it's a quiet row of selects that sit at the same visual
    // height as the action buttons on /workforce.
    <div className="flex flex-wrap items-end justify-end gap-3">
      <div>
        <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">
          Historical period
        </label>
        <select
          className="input"
          value={historical}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "custom") {
              update({ historical: "custom", hist_from: draftFrom, hist_to: draftTo });
            } else {
              update({ historical: v, hist_from: undefined, hist_to: undefined });
            }
          }}
          disabled={pending}
        >
          {HISTORICAL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {historical === "custom" ? (
        <>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">From</label>
            <input
              type="month"
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
              type="month"
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

      <div>
        <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">
          Forecast period
        </label>
        <select
          className="input"
          value={horizon}
          onChange={(e) => update({ horizon: e.target.value })}
          disabled={pending}
        >
          {HORIZON_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
