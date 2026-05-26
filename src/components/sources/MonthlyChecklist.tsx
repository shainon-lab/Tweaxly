"use client";

// "Upload missing data" checklist.
//
// Surfaces every (source × month) cell across the coverage matrix
// whose status is "missing" — not just the previous month — so the
// owner sees the full backlog at a glance and can fix any gap.
// Each missing month becomes a clickable chip that deep-links into
// /manual-data with the source + period pre-selected.
//
// Rows are grouped per source so a workspace with one consistently-
// missed source doesn't get a flat wall of "Source · Month" pairs.
// Sources are ordered Bank → Card → PayPal → Other to match the
// recommended upload sequence (settlement detection uses bank totals
// to match card/paypal/provider settlements against).

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

type CoverageCell = { ym: string; status: "uploaded" | "missing" | "out_of_window" };
type Source = {
  id:        string;
  name:      string;
  type:      string;
  currency:  string;
  last4:     string | null;
  startMonth: string;
  cells:     CoverageCell[];
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

type SourceGap = {
  source:        Source;
  missingMonths: string[]; // YM, descending (newest first)
};

export default function MonthlyChecklist({ bare = false }: { bare?: boolean } = {}) {
  // `bare` drops the outer card chrome so the checklist can be embedded
  // inside another card (used on /sources where Monthly coverage and
  // the checklist share one box).
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

  const { gaps, totalMissing, allDone, anySourceExpected } = useMemo(() => {
    if (!coverage) {
      return { gaps: [] as SourceGap[], totalMissing: 0, allDone: true, anySourceExpected: false };
    }
    const gaps: SourceGap[] = [];
    let anySourceExpected = false;
    for (const s of coverage.sources) {
      const expected = s.cells.filter((c) => c.status !== "out_of_window");
      if (expected.length === 0) continue;
      anySourceExpected = true;
      const missing = expected
        .filter((c) => c.status === "missing")
        .map((c) => c.ym)
        .sort((a, b) => b.localeCompare(a));
      if (missing.length > 0) gaps.push({ source: s, missingMonths: missing });
    }
    gaps.sort((a, b) => {
      const ta = TYPE_ORDER[a.source.type] ?? 99;
      const tb = TYPE_ORDER[b.source.type] ?? 99;
      if (ta !== tb) return ta - tb;
      return a.source.name.localeCompare(b.source.name);
    });
    const totalMissing = gaps.reduce((acc, g) => acc + g.missingMonths.length, 0);
    return { gaps, totalMissing, allDone: totalMissing === 0, anySourceExpected };
  }, [coverage]);

  if (loading) return null;
  // No active source has any expected months yet (e.g. a brand-new
  // workspace whose first source starts next month). The /sources page
  // still nudges them via the empty-state message.
  if (!anySourceExpected) return null;

  const body = (
    <>
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <div className="font-medium">Upload missing data</div>
        {!allDone ? (
          <Link href="/manual-data" className="text-xs text-accent">Start uploading →</Link>
        ) : null}
      </div>
      <div className="text-xs text-slate-400 mb-3">
        {allDone
          ? "Every active source has data for every expected month."
          : `${totalMissing} month${totalMissing === 1 ? "" : "s"} across ${gaps.length} source${gaps.length === 1 ? "" : "s"} ${totalMissing === 1 ? "is" : "are"} missing data. Recommended upload order: bank first (so settlement detection has totals to match against), then cards, then PayPal, then everything else.`}
      </div>

      {allDone ? (
        <div className="rounded-md border border-good/30 bg-good/10 px-3 py-2 text-sm text-good inline-flex items-center gap-2">
          <CheckCircle2 size={16} /> Every active source is up to date.
        </div>
      ) : (
        <ul className="space-y-2.5">
          {gaps.map((g) => (
            <li key={g.source.id} className="rounded-md border border-line/60 bg-ink-900/30 px-3 py-2.5">
              <div className="flex items-baseline justify-between gap-3 mb-1.5 flex-wrap">
                <div className="min-w-0">
                  <div className="text-sm text-slate-100 truncate">
                    {g.source.name}
                    {g.source.last4 ? <span className="text-slate-500 ml-2 font-mono text-xs">·{g.source.last4}</span> : null}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {TYPE_LABEL[g.source.type] ?? g.source.type} · {g.source.currency} · {g.missingMonths.length} missing
                  </div>
                </div>
              </div>
              {/* Missing months — one chip per month. Clicking jumps
                  into the upload flow with source + period pre-set. */}
              <div className="flex flex-wrap gap-1.5">
                {g.missingMonths.map((ym) => (
                  <Link
                    key={ym}
                    href={`/manual-data?source=${encodeURIComponent(g.source.id)}&month=${encodeURIComponent(ym)}`}
                    className="inline-flex items-center gap-1 rounded-md border border-warn/40 bg-warn/10 px-2 py-0.5 text-[11px] font-medium text-warn hover:bg-warn/20 transition"
                    title={`Upload ${g.source.name} for ${humanYm(ym)}`}
                  >
                    {shortYm(ym)} <span className="opacity-60">↑</span>
                  </Link>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  if (bare) return body;
  return <div className="card mb-4">{body}</div>;
}

function humanYm(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function shortYm(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}
