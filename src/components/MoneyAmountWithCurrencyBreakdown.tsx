"use client";

// MoneyAmountWithCurrencyBreakdown
//
// Display primitive for aggregated financial amounts. When the
// underlying transactions are all in the business base currency, this
// renders identically to plain fmtMoney() — no badge, no tooltip.
//
// When the aggregate includes more than one original currency, it
// shows the base-currency total followed by a small info chip; on
// hover/click/focus, a tooltip discloses:
//
//   • the converted total in base currency
//   • a per-currency breakdown (original total → base-currency total)
//   • the conversion method used (defaults to daily historical)
//   • the date range, if provided
//
// Hard rule (per spec): never hide that an aggregate combined
// multiple currencies. The info chip is the only signal users have
// that what they're seeing is a translation, not native.

import { useState } from "react";
import { fmtMoney } from "@/lib/format";

export interface CurrencyBreakdownItem {
  originalCurrency:      string;  // ISO 4217 e.g. "EUR"
  originalAmountTotal:   number;  // sum of original signed amounts
  convertedAmountTotal:  number;  // sum in base currency
  baseCurrency:          string;
  conversionMethod?:     string;  // "daily_historical" | "monthly_avg" | "manual_fixed"
}

// Where the tooltip opens relative to the info chip. Useful for
// right-aligned table cells where the default bottom-left opens past
// the viewport edge — set "top-right" so it opens upward and anchored
// to the chip's right edge.
export type BreakdownTooltipPlacement =
  | "bottom-left"   // default — tooltip's top-left at chip's bottom-left
  | "bottom-right"  // tooltip's top-right at chip's bottom-right
  | "top-left"      // tooltip's bottom-left at chip's top-left
  | "top-right";    // tooltip's bottom-right at chip's top-right

export interface MoneyAmountWithCurrencyBreakdownProps {
  convertedTotal:        number;
  baseCurrency:          string;
  currencyBreakdown:     CurrencyBreakdownItem[];
  // Caller can pre-compute this. If omitted we derive it from the
  // breakdown (length > 1 OR a single non-base entry).
  hasMultipleCurrencies?: boolean;
  conversionMethod?:     string;  // default: "daily_historical"
  dateRange?:            { from?: string | Date | null; to?: string | Date | null } | null;
  signed?:               boolean; // show + for positives
  className?:            string;
  placement?:            BreakdownTooltipPlacement;
  // Optional override of the tooltip lead sentence (defaults to a
  // generic "Converted using historical daily rates based on each
  // transaction date.").
  rateMethodNote?:       string;
}

const PLACEMENT_CLASSES: Record<BreakdownTooltipPlacement, string> = {
  "bottom-left":  "left-0 top-full mt-1",
  "bottom-right": "right-0 top-full mt-1",
  "top-left":     "left-0 bottom-full mb-1",
  "top-right":    "right-0 bottom-full mb-1",
};

function isMixed(breakdown: CurrencyBreakdownItem[], base: string): boolean {
  if (!breakdown || breakdown.length === 0) return false;
  const baseUC = base.toUpperCase();
  const nonBase = breakdown.filter((b) => b.originalCurrency.toUpperCase() !== baseUC);
  if (nonBase.length === 0) return false;
  // Even one non-base contributor makes it mixed.
  return true;
}

function formatDateRange(r?: { from?: string | Date | null; to?: string | Date | null } | null): string | null {
  if (!r || (!r.from && !r.to)) return null;
  const fmt = (d: string | Date) => {
    const dd = typeof d === "string" ? new Date(d) : d;
    if (Number.isNaN(dd.getTime())) return "";
    return dd.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };
  if (r.from && r.to) return `${fmt(r.from)} – ${fmt(r.to)}`;
  if (r.from) return `since ${fmt(r.from)}`;
  if (r.to)   return `through ${fmt(r.to)}`;
  return null;
}

const METHOD_LABEL: Record<string, string> = {
  daily_historical: "Daily historical rate",
  monthly_avg:      "Monthly average rate",
  manual_fixed:     "Manual fixed rate",
  same_currency:    "—",
  none:             "—",
};

export default function MoneyAmountWithCurrencyBreakdown(p: MoneyAmountWithCurrencyBreakdownProps) {
  const [open, setOpen] = useState(false);
  const mixed = p.hasMultipleCurrencies ?? isMixed(p.currencyBreakdown, p.baseCurrency);

  const main = p.signed
    ? (p.convertedTotal > 0 ? "+" : p.convertedTotal < 0 ? "−" : "") + fmtMoney(Math.abs(p.convertedTotal), p.baseCurrency)
    : fmtMoney(p.convertedTotal, p.baseCurrency);

  if (!mixed) {
    return <span className={p.className}>{main}</span>;
  }

  const dateRangeText = formatDateRange(p.dateRange);
  const method = p.conversionMethod ?? "daily_historical";
  const methodLabel = METHOD_LABEL[method] ?? method;
  const note = p.rateMethodNote ?? "Converted using historical daily rates based on each transaction date.";

  return (
    <span className={`inline-flex items-center gap-1 relative ${p.className ?? ""}`}>
      <span>{main}</span>
      <button
        type="button"
        aria-label="Show currency breakdown"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-accent/40 bg-accent/10 text-accent text-[10px] font-semibold leading-none transition hover:bg-accent/20"
      >
        i
      </button>
      {open ? (
        <span
          role="tooltip"
          className={`absolute z-50 ${PLACEMENT_CLASSES[p.placement ?? "bottom-left"]} w-80 rounded-lg border border-line bg-ink-900 shadow-2xl shadow-black/50 text-xs text-slate-200 p-3 leading-normal`}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="font-semibold text-white mb-1.5">
            Multi-currency total
          </div>
          <div className="text-slate-300 mb-2">
            Total converted: <span className="font-medium text-slate-100">
              {fmtMoney(p.convertedTotal, p.baseCurrency)}
            </span>
          </div>

          <div className="border-t border-line/70 pt-2 mb-2">
            <div className="text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide">
              Currency breakdown
            </div>
            <ul className="space-y-1">
              {p.currencyBreakdown.map((b) => (
                <li key={b.originalCurrency} className="flex items-baseline justify-between gap-3 tabular-nums">
                  <span className="text-slate-300 font-medium">{b.originalCurrency}</span>
                  <span className="text-slate-200">
                    {fmtMoney(b.originalAmountTotal, b.originalCurrency)}
                    <span className="text-slate-500 mx-1">→</span>
                    {fmtMoney(b.convertedAmountTotal, b.baseCurrency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-line/70 pt-2 text-[11px] text-slate-400 space-y-0.5">
            <div>Method: <span className="text-slate-300">{methodLabel}</span></div>
            {dateRangeText ? <div>Range: <span className="text-slate-300">{dateRangeText}</span></div> : null}
            <div className="mt-1 text-slate-500 leading-snug">{note}</div>
          </div>
        </span>
      ) : null}
    </span>
  );
}
