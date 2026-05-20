"use client";

// Renders a transaction amount with a small "converted" indicator
// when the source currency differs from the business base currency.
// Hovering the indicator opens a tooltip with the full conversion
// audit: original amount + currency, rate, rate date, source, method.
//
// For same-currency rows, the indicator is omitted and the component
// renders identically to a plain fmtMoney() call.

import { useState } from "react";
import { fmtMoney } from "@/lib/format";

export interface CurrencyAmountProps {
  amount: number;                 // value in base currency
  baseCurrency: string;
  originalAmount?: number | null;
  originalCurrency?: string | null;
  exchangeRate?: number | null;
  exchangeRateDate?: string | Date | null;
  exchangeRateSource?: string | null;
  conversionMethod?: string | null;
  rateFetchStatus?: string | null;
  signed?: boolean;               // show + for positive
  className?: string;
}

function sameAsBase(p: CurrencyAmountProps): boolean {
  if (!p.originalCurrency) return true;
  return p.originalCurrency.toUpperCase() === p.baseCurrency.toUpperCase();
}

function formatRateDate(d: string | Date | null | undefined): string {
  if (!d) return "-";
  const dd = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dd.getTime())) return "-";
  return dd.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const SOURCE_LABEL: Record<string, string> = {
  frankfurter:    "Frankfurter",
  ecb:            "ECB",
  manual:         "Manual",
  same_currency:  "Same currency",
};

const METHOD_LABEL: Record<string, string> = {
  daily_historical: "Daily historical rate",
  monthly_avg:      "Monthly average rate",
  manual_fixed:     "Manual fixed rate",
  none:             "-",
};

export default function CurrencyAmount(p: CurrencyAmountProps) {
  const [open, setOpen] = useState(false);
  const same = sameAsBase(p);
  const display = p.signed
    ? (p.amount > 0 ? "+" : p.amount < 0 ? "−" : "") + fmtMoney(Math.abs(p.amount), p.baseCurrency)
    : fmtMoney(p.amount, p.baseCurrency);

  // Same-currency or no FX info - plain text, no badge.
  if (same) {
    return <span className={p.className}>{display}</span>;
  }

  const needsReview = p.rateFetchStatus === "needs_review" || p.rateFetchStatus === "failed" || p.rateFetchStatus === "missing";

  return (
    <span className={`inline-flex items-center gap-1 relative ${p.className ?? ""}`}>
      <span>{display}</span>
      <button
        type="button"
        aria-label="Show conversion details"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className={`inline-flex items-center justify-center w-4 h-4 rounded-full border text-[9px] font-semibold leading-none transition ${
          needsReview
            ? "border-bad/60 bg-bad/10 text-bad"
            : "border-accent/40 bg-accent/10 text-accent hover:bg-accent/20"
        }`}
      >
        {needsReview ? "!" : "fx"}
      </button>
      {open ? (
        <span
          role="tooltip"
          className="absolute z-50 left-0 top-full mt-1 w-64 rounded-lg border border-line bg-ink-900 shadow-2xl shadow-black/50 text-xs text-slate-200 p-3 leading-normal"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="font-semibold text-white mb-1.5">
            {needsReview ? "Rate needs review" : "Currency conversion"}
          </div>
          <Row label="Original">
            {fmtMoney(p.originalAmount ?? p.amount, (p.originalCurrency ?? p.baseCurrency))}
          </Row>
          <Row label="Converted">
            {fmtMoney(p.amount, p.baseCurrency)}
          </Row>
          <Row label="Rate">
            {p.exchangeRate != null ? p.exchangeRate.toFixed(4) : "-"}
          </Row>
          <Row label="Rate date">{formatRateDate(p.exchangeRateDate)}</Row>
          <Row label="Source">{SOURCE_LABEL[p.exchangeRateSource ?? ""] ?? (p.exchangeRateSource ?? "-")}</Row>
          <Row label="Method">{METHOD_LABEL[p.conversionMethod ?? ""] ?? (p.conversionMethod ?? "-")}</Row>
          {needsReview ? (
            <div className="mt-2 text-[11px] text-bad">
              Rate not available. Set a manual rate from the transaction details.
            </div>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-100 tabular-nums">{children}</span>
    </div>
  );
}
