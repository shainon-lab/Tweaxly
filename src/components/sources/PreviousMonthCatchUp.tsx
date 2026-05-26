"use client";

// Dashboard banner that escalates when the PREVIOUS full month is
// still missing data from one or more sources.
//
// Rule from the spec: if it's currently May and we don't have April
// data from every source, the dashboard shouts about it. Even ONE
// missing source counts - the workspace's reports are incomplete
// until every source has uploaded April. The current in-progress
// month (May, in this example) is NOT counted as missing.
//
// Auto-hides when:
//   - The workspace has no sources yet (the GetStartedBanner takes
//     that role)
//   - Every active source has uploaded the previous full month
//
// Uses the same /api/financial-sources/health endpoint as the
// HealthScoreWidget so it never disagrees with the percentage tile.

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

type Health = {
  percent:        number | null;
  previousMonth:  string;
  gaps: { sourceId: string; sourceName: string; missingMonths: string[] }[];
};

export default function PreviousMonthCatchUp() {
  const [data, setData] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/financial-sources/health");
        const d = await r.json();
        if (!cancelled) setData(d);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true };
  }, []);

  if (loading || !data) return null;
  // Filter to only sources that are missing the previous full month
  // specifically. A source can still have older gaps (surfaced by the
  // HealthScoreWidget) without triggering this banner - the spec is
  // explicit that the urgent case is the just-completed month.
  const missingPrev = data.gaps.filter((g) => g.missingMonths.includes(data.previousMonth));
  if (missingPrev.length === 0) return null;

  const one = missingPrev.length === 1;
  return (
    <div className="card mb-4 border-warn/40 bg-warn/10">
      <div className="flex items-start gap-3 flex-wrap">
        <AlertTriangle size={18} className="text-warn shrink-0 mt-0.5" />
        <div className="flex-1 min-w-[260px]">
          <div className="text-sm font-medium text-slate-100">
            {one
              ? `${missingPrev[0].sourceName} hasn't uploaded ${humanYm(data.previousMonth)} yet`
              : `${missingPrev.length} sources are missing ${humanYm(data.previousMonth)} data`}
          </div>
          <div className="text-xs text-slate-300 mt-1 leading-relaxed">
            Your financial data isn't complete for {humanYm(data.previousMonth)} until every source has uploaded its statement. Reports, the AI advisor, and forecasts will be inaccurate or incomplete until then.
          </div>
          {!one ? (
            <ul className="text-xs text-slate-400 mt-2 space-y-0.5 pl-5 list-disc">
              {missingPrev.map((g) => (
                <li key={g.sourceId}>
                  <span className="text-slate-200">{g.sourceName}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <Link
          href="/manual-data"
          className="text-xs font-medium px-3 py-1.5 rounded-md border border-warn/50 text-warn hover:bg-warn/10 transition inline-flex items-center gap-1.5 shrink-0 self-start"
        >
          Upload now <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}

function humanYm(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
