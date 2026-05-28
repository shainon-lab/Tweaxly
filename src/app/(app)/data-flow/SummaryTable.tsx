"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import MoneyAmountWithCurrencyBreakdown from "@/components/MoneyAmountWithCurrencyBreakdown";
import type { BreakdownResult } from "@/lib/currencyBreakdown";
import { notify } from "@/lib/notify";

type SummaryRowOutcome = {
  name: string;
  kind: string;
  total: number;       // absolute outflow magnitude (always positive in summary)
  categoryId: string;  // category id, for the inline kind-toggle
};

type SummaryRowRevenue = {
  name: string;
  kind: string;
  total: number;       // signed (typically positive)
  categoryId: string;
};

export type SummaryProps = {
  ccy: string;
  revenue: number;             // total revenue (sum of all revenue rows)
  revenues: SummaryRowRevenue[];
  outcomes: SummaryRowOutcome[];
  totalOutcome: number;
  pnl: number;
  marginPct: number | null;
  monthCount: number;
  fromYM: string;
  toYM: string;
  // Heuristic: if there are zero income transactions in the period, show a
  // banner offering to flip the largest outcome to income.
  noRevenueDetected: boolean;
  // Currency-composition breakdowns for the disclosure chips. The page
  // computes these once for the window and passes them in. Each
  // category subtotal looks itself up via categoryBreakdowns[catId].
  revenueFx: BreakdownResult;
  outcomeFx: BreakdownResult;
  pnlFx: BreakdownResult;
  categoryBreakdowns: Record<string, BreakdownResult>;
};

// Data-flow rows live in a table so cells line up nicely with `.00`.
function fmtMoney(v: number, ccy: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: ccy,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v);
  } catch {
    return `${ccy} ${Math.round(v).toLocaleString("en-US")}`;
  }
}

function fmtPct(v: number) {
  if (!isFinite(v)) return "-";
  const sign = v > 0 ? "+" : "";
  return `${sign}${(v * 100).toFixed(1)}%`;
}

export default function SummaryTable(props: SummaryProps) {
  const {
    ccy,
    revenue,
    revenues,
    outcomes,
    revenueFx,
    outcomeFx,
    pnlFx,
    categoryBreakdowns,
    totalOutcome,
    pnl,
    marginPct,
    noRevenueDetected,
  } = props;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function flipKind(
    categoryId: string,
    fromKind: string,
    toKind: "revenue" | "other",
  ) {
    const ok = await notify.confirm({
      title: "Reclassify category?",
      body: toKind === "revenue"
        ? "Reclassify this category as REVENUE/INCOME? Existing transactions in this category will be re-signed positive (so the data flow + dashboard pick it up as income)."
        : "Reclassify this category as OUTCOME? Existing transactions will be re-signed negative.",
      confirmLabel: "Reclassify",
    });
    if (!ok) return;
    setBusyId(categoryId);
    try {
      const res = await fetch("/api/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: categoryId,
          kind: toKind,
          flipSigns: true,
        }),
      });
      if (!res.ok) {
        notify.alert(await res.text());
        return;
      }
      startTransition(() => router.refresh());
      void fromKind; // kept for potential future logging
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      {noRevenueDetected ? (
        <div className="card mb-4 border-warn/40 bg-warn/5">
          <div className="flex items-start gap-3">
            <span className="pill-warn shrink-0 mt-0.5">no revenue detected</span>
            <div className="text-sm text-slate-200 leading-relaxed">
              <span className="font-medium">
                The system didn't recognize any revenue in this view.
              </span>{" "}
              That usually means a category that should be revenue (Sales, Income, Service Fee, …) was classified as outcome. Click <span className="font-medium">"→ Income"</span> on the right side of any row below to flip its type - existing transactions will be re-signed automatically.
            </div>
          </div>
        </div>
      ) : null}

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Category</th>
              <th>Type</th>
              <th className="text-right">Total</th>
              <th className="text-right">% of total outcome</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {/* One row per revenue category - same structure as outcomes */}
            {revenues.map((r) => {
              return (
                <tr key={r.categoryId} className="bg-good/5">
                  <td className="font-semibold text-good">{r.name}</td>
                  <td>
                    <span className="pill-good">Income</span>
                  </td>
                  <td className="text-right font-semibold text-good">
                    {(() => {
                      const fx = categoryBreakdowns[r.categoryId];
                      return fx ? (
                        <>+<MoneyAmountWithCurrencyBreakdown
                          convertedTotal={r.total}
                          baseCurrency={ccy}
                          currencyBreakdown={fx.currencyBreakdown}
                          hasMultipleCurrencies={fx.hasMultipleCurrencies}
                          conversionMethod={fx.conversionMethod}
                        /></>
                      ) : <>+{fmtMoney(r.total, ccy)}</>;
                    })()}
                  </td>
                  <td className="text-right text-slate-500">-</td>
                  <td className="text-right">
                    <button
                      className="btn-ghost py-1 text-xs"
                      disabled={busyId === r.categoryId || pending}
                      onClick={() => flipKind(r.categoryId, "revenue", "other")}
                      title="Reclassify this category as outcome"
                    >
                      → Outcome
                    </button>
                  </td>
                </tr>
              );
            })}
            {/* Total revenue subtotal - shown when there are 2+ revenue categories */}
            {revenues.length > 1 ? (
              <tr className="bg-good/10 border-t-2 border-good/30">
                <td colSpan={2} className="font-bold uppercase tracking-wide text-xs text-good">
                  Total revenue
                </td>
                <td className="text-right font-bold text-good">
                  +<MoneyAmountWithCurrencyBreakdown
                    convertedTotal={revenue}
                    baseCurrency={ccy}
                    currencyBreakdown={revenueFx.currencyBreakdown}
                    hasMultipleCurrencies={revenueFx.hasMultipleCurrencies}
                    conversionMethod={revenueFx.conversionMethod}
                  />
                </td>
                <td className="text-right text-slate-500">-</td>
                <td></td>
              </tr>
            ) : null}
            {outcomes.map((o) => {
              // Percentage is each outcome's share of the TOTAL OUTCOME pie,
              // so the sum across outcome rows = 100% and the user can read
              // which categories dominate spend.
              const pct = totalOutcome > 0 ? o.total / totalOutcome : null;
              return (
                <tr key={o.name}>
                  <td className="font-medium">{o.name}</td>
                  <td>
                    <span className="pill-bad">Outcome</span>
                  </td>
                  <td className="text-right text-bad">
                    {(() => {
                      const fx = categoryBreakdowns[o.categoryId];
                      return fx ? (
                        <>−<MoneyAmountWithCurrencyBreakdown
                          convertedTotal={o.total}
                          baseCurrency={ccy}
                          currencyBreakdown={fx.currencyBreakdown}
                          hasMultipleCurrencies={fx.hasMultipleCurrencies}
                          conversionMethod={fx.conversionMethod}
                        /></>
                      ) : <>−{fmtMoney(o.total, ccy)}</>;
                    })()}
                  </td>
                  <td className="text-right text-slate-300">
                    {pct == null ? "-" : `${(pct * 100).toFixed(1)}%`}
                  </td>
                  <td className="text-right">
                    <button
                      className="btn-ghost py-1 text-xs"
                      disabled={busyId === o.categoryId || pending}
                      onClick={() => flipKind(o.categoryId, o.kind, "revenue")}
                      title="Reclassify this category as income (revenue)"
                    >
                      → Income
                    </button>
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-line">
              <td colSpan={2} className="font-bold uppercase tracking-wide text-xs">
                Total outcome
              </td>
              <td className="text-right font-semibold text-bad">
                −<MoneyAmountWithCurrencyBreakdown
                  convertedTotal={totalOutcome}
                  baseCurrency={ccy}
                  currencyBreakdown={outcomeFx.currencyBreakdown}
                  hasMultipleCurrencies={outcomeFx.hasMultipleCurrencies}
                  conversionMethod={outcomeFx.conversionMethod}
                />
              </td>
              <td className="text-right font-semibold text-slate-200">
                {totalOutcome > 0 ? "100.0%" : "-"}
              </td>
              <td></td>
            </tr>
            <tr className={pnl >= 0 ? "bg-good/10" : "bg-bad/10"}>
              <td className="font-bold">P&amp;L</td>
              <td>
                <span className={pnl >= 0 ? "pill-good" : "pill-bad"}>
                  {pnl >= 0 ? "Profit" : "Loss"}
                </span>
              </td>
              <td
                className={`text-right font-bold text-base ${pnl >= 0 ? "text-good" : "text-bad"}`}
              >
                <MoneyAmountWithCurrencyBreakdown
                  convertedTotal={pnl}
                  baseCurrency={ccy}
                  currencyBreakdown={pnlFx.currencyBreakdown}
                  hasMultipleCurrencies={pnlFx.hasMultipleCurrencies}
                  conversionMethod={pnlFx.conversionMethod}
                  signed
                />
              </td>
              <td className="text-right text-slate-500">-</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-500 mt-3">
        Revenue is treated as income; every non-revenue category is outcome. The <span className="text-slate-300">% of total outcome</span> column shows each outcome category&apos;s share of total spend - the column sums to 100% across outcome rows. Click <span className="text-slate-300">&quot;→ Income&quot;</span> on any outcome row to reclassify it - existing transactions will be re-signed.
      </div>
    </>
  );
}
