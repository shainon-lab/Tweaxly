"use client";

// The setup row at the top of the Forecast tab - historical period selector
// and forecast horizon selector, both URL-driven. Custom historical range
// exposes from/to month inputs.

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

// Aligned with src/lib/forecastEngine.ts BASELINE_OPTIONS.
//   - "recommended" lets the engine pick per readiness rules (default).
//   - "Last Month" is intentionally absent - one month is not enough
//     data for a reliable forecast.
//   - 18m / 24m are available; recommended default stays 12m even with
//     24+ months of history (per spec, older data may be less relevant).
// "Last 12 months" carries the (recommended) tag in the picker - it's
// the readiness-engine's default for any business with 12+ months of
// validated data. The dropdown no longer has a separate "Recommended"
// entry; the page maps a missing/legacy `recommended` URL value back
// to "12m" so prior links keep working.
const HISTORICAL_OPTIONS = [
  { value: "3m",        label: "Last Quarter (3 months)" },
  { value: "6m",        label: "Last 6 months" },
  { value: "12m",       label: "Last 12 months (recommended)" },
  { value: "18m",       label: "Last 18 months" },
  { value: "24m",       label: "Last 24 months" },
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

// Last day of the previous calendar month - used as the maximum
// allowed "To" date in the custom picker. Forecasts must never
// include an in-progress month because incomplete data would
// distort the baseline trend.
function lastDayPrevMonthISO() {
  const d = new Date();
  // Day 0 of current month = last day of previous month in UTC.
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 0));
  return last.toISOString().slice(0, 10);
}

// Default custom From = first day of (lastFullMonth - 11) so the
// default window spans 12 complete months ending at the last full
// month. To = last day of the previous month (current month never
// participates).
function defaultCustomFromISO() {
  const d = new Date();
  const first = new Date(Date.UTC(d.getUTCFullYear() - 1, d.getUTCMonth(), 1));
  return first.toISOString().slice(0, 10);
}

// Engine accepts either YM (YYYY-MM) or full ISO (YYYY-MM-DD). We
// push full ISO so the engine can count actual days selected and
// include the number in its error message - keeps the message
// consistent with what the user just picked.

// Validation now lives in the engine: it returns "Forecast unavailable"
// when the resolved range is < 90 days, and the page hides the body
// in that state. Removing the client-side 90-day check here keeps the
// rules single-sourced.

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
  // Day-level pickers. URL now carries full ISO dates (YYYY-MM-DD);
  // we also accept legacy YYYY-MM and snap to 1st-of / 28th-of for
  // backward compatibility with old bookmarks.
  const hydrateISO = (s: string | undefined, mode: "from" | "to") => {
    if (!s) return mode === "from" ? defaultCustomFromISO() : lastDayPrevMonthISO();
    if (s.length === 10) return s;                         // already YYYY-MM-DD
    if (s.length === 7)  return mode === "from" ? `${s}-01` : `${s}-28`;
    return mode === "from" ? defaultCustomFromISO() : lastDayPrevMonthISO();
  };
  const [draftFromISO, setDraftFromISO] = useState(hydrateISO(histFrom, "from"));
  const [draftToISO,   setDraftToISO]   = useState(hydrateISO(histTo,   "to"));

  function update(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === "") params.delete(k);
      else params.set(k, v);
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  // Auto-apply on every date change. The page's SSR engine sees the
  // new range, validates the 90-day rule, and either renders the
  // forecast or surfaces the "Forecast unavailable" card. Removing
  // the explicit Apply button keeps state consistent - there's no
  // "inline warning + stale forecast underneath" confusion.
  function applyDates(fromISO: string, toISO: string) {
    if (!fromISO || !toISO) return;
    const a = fromISO <= toISO ? fromISO : toISO;
    const b = fromISO <= toISO ? toISO : fromISO;
    update({ historical: "custom", hist_from: a, hist_to: b });
  }

  return (
    // Compact inline filter cluster - designed to live in the
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
              // Seed the URL with the day-level defaults so the first
              // render of "Custom" produces a valid 12-month window
              // - no flicker through an invalid state.
              update({
                historical: "custom",
                hist_from:  draftFromISO,
                hist_to:    draftToISO,
              });
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
              type="date"
              className="input"
              value={draftFromISO}
              max={draftToISO || lastDayPrevMonthISO()}
              onChange={(e) => {
                const next = e.target.value;
                setDraftFromISO(next);
                applyDates(next, draftToISO);
              }}
              disabled={pending}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-slate-400 block mb-1">To</label>
            <input
              type="date"
              className="input"
              value={draftToISO}
              min={draftFromISO || undefined}
              max={lastDayPrevMonthISO()}
              onChange={(e) => {
                const next = e.target.value;
                setDraftToISO(next);
                applyDates(draftFromISO, next);
              }}
              disabled={pending}
            />
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
