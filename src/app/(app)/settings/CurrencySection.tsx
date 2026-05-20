"use client";

// Currency section for the Business Settings profile tab. Shows the
// business base currency (read-only — it's edited from the main
// profile form) plus the currencies auto-detected from imported and
// manual transactions, with a count for each. Below the list, the
// conversion-method picker (only daily_historical is wired today;
// the other options are previewed as "coming soon").

import { useEffect, useState } from "react";

interface Props { baseCurrency: string; }

interface DetectedRow { currency: string; count: number; }

export default function CurrencySection({ baseCurrency }: Props) {
  const [detected, setDetected] = useState<DetectedRow[] | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/business/currencies");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        setDetected(j.detected as DetectedRow[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load detected currencies.");
      }
    })();
  }, [baseCurrency]);

  const nonBase = (detected ?? []).filter((d) => d.currency !== baseCurrency.toUpperCase());

  return (
    <div className="card mb-6">
      <div className="font-medium mb-1">Currency</div>
      <div className="text-xs text-slate-400 mb-4 leading-relaxed">
        Reports, forecasts, dashboards, and AI insights are normalized
        to your base currency. Transactions in other currencies are
        converted at the historical rate from the transaction date —
        you don&apos;t need to define a currency list in advance.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="label">Base currency</label>
          <input className="input bg-ink-900/60" readOnly value={baseCurrency} aria-readonly="true" />
          <div className="text-[11px] text-slate-500 mt-1">
            Edit in the Business Profile section above. Changing the
            base currency does not retroactively re-convert existing
            transactions.
          </div>
        </div>
        <div>
          <label className="label">Conversion method</label>
          <select className="input" defaultValue="daily_historical" disabled>
            <option value="daily_historical">Daily historical rate (recommended)</option>
            <option value="monthly_avg" disabled>Monthly average rate (coming soon)</option>
            <option value="manual_fixed" disabled>Manual fixed rate (coming soon)</option>
          </select>
          <div className="text-[11px] text-slate-500 mt-1">
            Rates from Frankfurter (ECB-sourced). Cached locally on first
            use. Manual override is available per transaction.
          </div>
        </div>
        <div>
          <label className="label">Rate source</label>
          <input className="input bg-ink-900/60" readOnly value="Frankfurter (ECB)" aria-readonly="true" />
          <div className="text-[11px] text-slate-500 mt-1">
            No API key required. Free for production use.
          </div>
        </div>
      </div>

      <div className="font-medium text-sm mb-2 mt-2">Detected currencies</div>
      <div className="text-xs text-slate-400 mb-3">
        Built automatically from your imported and manual transactions.
      </div>

      {error ? (
        <div className="text-xs text-bad">{error}</div>
      ) : detected === null ? (
        <div className="text-xs text-slate-400">Loading…</div>
      ) : nonBase.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-ink-900/30 p-4 text-xs text-slate-400">
          All your transactions are already in <strong>{baseCurrency}</strong>.
          When you import data in other currencies, they&apos;ll show up here.
        </div>
      ) : (
        <div className="rounded-lg border border-line overflow-hidden">
          <table className="table-base">
            <thead>
              <tr><th>Currency</th><th className="text-right">Transactions</th></tr>
            </thead>
            <tbody>
              {nonBase.map((d) => (
                <tr key={d.currency}>
                  <td>{d.currency}</td>
                  <td className="text-right tabular-nums">{d.count.toLocaleString("en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
