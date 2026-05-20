"use client";

// The setup row at the top of the Forecast tab — historical period selector
// and forecast horizon selector, both URL-driven. Custom historical range
// exposes from/to month inputs.

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

// Aligned with src/lib/forecastEngine.ts BASELINE_OPTIONS.
//   - "recommended" lets the engine pick per readiness rules (default).
//   - "Last Month" is intentionally absent — one month is not enough
//     data for a reliable forecast.
//   - 18m / 24m are available; recommended default stays 12m even with
//     24+ months of history (per spec, older data may be less relevant).
// "Last 12 months" carries the (recommended) tag in the picker — it's
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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Default custom From = 12 months back from today's first-of-month,
// To = today. Produces a ~365-day window that comfortably passes the
// engine's 90-day guard, so picking "Custom" never lands the user in
// an invalid state by default.
function defaultCustomFromISO() {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  d.setUTCDate(1);
  return d.toISOString().slice(0, 10);
}

// Engine works on accountingMonth (YYYY-MM). Day-level dates are
// projected onto their containing month — for date-picker UX the user
// thinks in days, but the underlying buckets are still months.
function isoToYM(iso: string): string {
  return iso.slice(0, 7);
}

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
  // Day-level pickers. URL still carries YM granularity for the
  // engine; we hydrate the day defaults from the URL (snapping to
  // the 1st of the month for From and the last day for To when
  // arriving from a YM-only URL).
  const [draftFromISO, setDraftFromISO] = useState(
    histFrom ? `${histFrom}-01` : defaultCustomFromISO(),
  );
  const [draftToISO,   setDraftToISO]   = useState(
    histTo   ? `${histTo}-28`   : todayISO(),
  );

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
  // the explicit Apply button keeps state consistent — there's no
  // "inline warning + stale forecast underneath" confusion.
  function applyDates(fromISO: string, toISO: string) {
    if (!fromISO || !toISO) return;
    const a = fromISO <= toISO ? fromISO : toISO;
    const b = fromISO <= toISO ? toISO : fromISO;
    update({ historical: "custom", hist_from: isoToYM(a), hist_to: isoToYM(b) });
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
              // Seed the URL with the day-defaults' YMs so the first
              // render of "Custom" produces a valid 12-month window
              // — no flicker through an invalid state.
              update({
                historical: "custom",
                hist_from:  isoToYM(draftFromISO),
                hist_to:    isoToYM(draftToISO),
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
              max={draftToISO || todayISO()}
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
              max={todayISO()}
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
