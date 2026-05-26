"use client";

// "Catch up on last month" checklist.
//
// Shows the previous full month and, for every active source, whether
// it's been uploaded yet. Rows are grouped by source type (Bank → Card
// → PayPal → Other) which matches the recommended upload order. Each
// missing row has a one-click "Upload now" link into the guided wizard.
// Empty state: a clean "you're all caught up" card so finished workspaces
// aren't pestered.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

type Source = {
  id:        string;
  name:      string;
  type:      string;
  currency:  string;
  last4:     string | null;
  startMonth: string;
  cells:     { ym: string; status: "uploaded" | "missing" | "out_of_window" }[];
};

type CoverageResponse = {
  months:  string[];
  sources: Source[];
};

const TYPE_ORDER: Record<string, number> = {
  bank: 0, credit_card: 1, paypal: 2, payment_provider: 3, cash: 4, other: 5,
};
const TYPE_LABEL: Record<string, string> = {
  bank:             "Bank account",
  credit_card:      "Credit card",
  paypal:           "PayPal",
  payment_provider: "Payment provider",
  cash:             "Cash",
  other:            "Other",
};

export default function MonthlyChecklist({ bare = false }: { bare?: boolean } = {}) {
  // `bare` drops the outer card chrome so the checklist can be embedded
  // inside another card (used on /sources where Monthly coverage and
  // Catch up live together in one box).
  const [coverage, setCoverage] = useState<CoverageResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/financial-sources/coverage");
        const d = await r.json();
        if (!cancelled) setCoverage(d);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true };
  }, []);

  const { prevYM, items, allDone, anySourceExpected } = useMemo(() => {
    if (!coverage) return { prevYM: previousFullYm(), items: [], allDone: true, anySourceExpected: false };
    const prev = previousFullYm();
    type Item = { source: Source; uploaded: boolean; expected: boolean };
    const items: Item[] = coverage.sources.map((s) => {
      const cell = s.cells.find((c) => c.ym === prev);
      const expected = !!cell && cell.status !== "out_of_window";
      const uploaded = !!cell && cell.status === "uploaded";
      return { source: s, uploaded, expected };
    });
    items.sort((a, b) => {
      const ta = TYPE_ORDER[a.source.type] ?? 99;
      const tb = TYPE_ORDER[b.source.type] ?? 99;
      if (ta !== tb) return ta - tb;
      return a.source.name.localeCompare(b.source.name);
    });
    const expectedItems = items.filter((i) => i.expected);
    const allDone = expectedItems.length > 0 && expectedItems.every((i) => i.uploaded);
    return { prevYM: prev, items: expectedItems, allDone, anySourceExpected: expectedItems.length > 0 };
  }, [coverage]);

  if (loading) return null;
  // Hide when there are no sources expected for the previous month (e.g.
  // a brand-new workspace whose first source starts this month). The
  // /sources page still nudges them via the empty-state message.
  if (!anySourceExpected) return null;

  const body = (
    <>
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <div className="font-medium">Catch up on {humanYm(prevYM)}</div>
        <Link href="/manual-data" className="text-xs text-accent">Start uploading →</Link>
      </div>
      <div className="text-xs text-slate-400 mb-3">
        Recommended monthly upload order — bank first (so settlement detection has totals to match against), then cards, then PayPal, then everything else.
      </div>
      {allDone ? (
        <div className="rounded-md border border-good/30 bg-good/10 px-3 py-2 text-sm text-good inline-flex items-center gap-2">
          <CheckCircle2 size={16} /> Every active source is up to date for {humanYm(prevYM)}.
        </div>
      ) : (
        <ul className="space-y-1.5">
          {items.map((i) => (
            <li
              key={i.source.id}
              className={`flex items-center gap-3 py-1.5 px-2 rounded ${i.uploaded ? "" : "hover:bg-ink-700/40"}`}
            >
              {i.uploaded
                ? <CheckCircle2 size={16} className="text-good shrink-0" />
                : <Circle size={16} className="text-slate-500 shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-100 truncate">
                  {i.source.name}
                  {i.source.last4 ? <span className="text-slate-500 ml-2 font-mono text-xs">·{i.source.last4}</span> : null}
                </div>
                <div className="text-[11px] text-slate-500">
                  {TYPE_LABEL[i.source.type] ?? i.source.type} · {i.source.currency}
                </div>
              </div>
              {i.uploaded ? (
                <span className="text-[11px] text-good">Done</span>
              ) : (
                <Link href="/manual-data" className="text-xs font-medium text-accent hover:underline">
                  Upload now →
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );

  if (bare) return body;
  return <div className="card mb-4">{body}</div>;
}

function previousFullYm(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function humanYm(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
