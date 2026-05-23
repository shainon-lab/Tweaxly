"use client";

// Compact widget for the financial-data Import Health Score.
//
// Two variants via the `variant` prop:
//   "full"    — used on /sources page; shows the score, expected/uploaded
//               counts, and the list of gaps (worst first)
//   "compact" — used on /dashboard; just the percentage + a one-line
//               summary, links over to /sources for the breakdown
//
// Score color thresholds:
//   ≥90% good · ≥70% accent · ≥50% warn · <50% bad

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";

type Health = {
  percent:       number | null;
  totalExpected: number;
  totalUploaded: number;
  sourcesCount:  number;
  previousMonth: string;
  gaps: { sourceId: string; sourceName: string; missingMonths: string[] }[];
};

export default function HealthScoreWidget({ variant }: { variant: "full" | "compact" }) {
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

  if (loading)            return <Skeleton variant={variant} />;
  if (!data)              return null;
  if (data.percent === null && data.sourcesCount === 0) {
    return variant === "full" ? <EmptyState /> : null;
  }

  const pct = data.percent ?? 100;
  const tone = pct >= 90 ? "good" : pct >= 70 ? "accent" : pct >= 50 ? "warn" : "bad";
  const toneCls = {
    good:   "text-good   border-good/40   bg-good/5",
    accent: "text-accent border-accent/40 bg-accent-soft/30",
    warn:   "text-warn   border-warn/40   bg-warn/5",
    bad:    "text-bad    border-bad/40    bg-bad/5",
  }[tone];

  if (variant === "compact") {
    const totalMissing = data.gaps.reduce((sum, g) => sum + g.missingMonths.length, 0);
    return (
      <Link
        href="/sources"
        className={`card-tight flex items-center gap-3 hover:border-accent/40 transition ${toneCls}`}
      >
        <div className="text-2xl font-bold leading-none">{pct}%</div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-wider opacity-80">Financial data complete</div>
          <div className="text-xs opacity-90 truncate">
            {totalMissing === 0
              ? "All sources up to date."
              : `${totalMissing} missing month${totalMissing === 1 ? "" : "s"} across ${data.gaps.length} source${data.gaps.length === 1 ? "" : "s"}.`}
          </div>
        </div>
        <ChevronRight size={14} className="opacity-60 shrink-0" />
      </Link>
    );
  }

  // Full variant — used at the top of /sources.
  return (
    <div className={`card mb-4 border ${toneCls}`}>
      <div className="flex items-start gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-wider opacity-80">Financial data complete</div>
          <div className="text-3xl font-bold leading-tight">{pct}%</div>
          <div className="text-xs opacity-80 mt-0.5">
            {data.totalUploaded.toLocaleString()} of {data.totalExpected.toLocaleString()} expected (source × month) cells uploaded.
          </div>
        </div>
        <div className="flex-1 min-w-[240px]">
          {data.gaps.length === 0 ? (
            <div className="inline-flex items-center gap-2 text-sm">
              <CheckCircle2 size={16} /> Every active source is up to date through {humanYm(data.previousMonth)}.
            </div>
          ) : (
            <div>
              <div className="text-xs font-semibold opacity-90 mb-1.5 inline-flex items-center gap-1.5">
                <AlertTriangle size={13} /> Missing data
              </div>
              <ul className="text-xs space-y-0.5 opacity-90">
                {data.gaps.slice(0, 5).map((g) => (
                  <li key={g.sourceId}>
                    <span className="font-medium text-slate-100">{g.sourceName}</span>
                    <span className="opacity-70"> — {g.missingMonths.slice(0, 4).map(humanYm).join(", ")}</span>
                    {g.missingMonths.length > 4 ? <span className="opacity-60"> + {g.missingMonths.length - 4} more</span> : null}
                  </li>
                ))}
                {data.gaps.length > 5 ? (
                  <li className="opacity-60">+ {data.gaps.length - 5} more sources with gaps</li>
                ) : null}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Skeleton({ variant }: { variant: "full" | "compact" }) {
  return (
    <div className={variant === "full" ? "card mb-4 animate-pulse" : "card-tight animate-pulse"}>
      <div className="h-6 w-20 bg-ink-700 rounded mb-2" />
      <div className="h-3 w-40 bg-ink-700/70 rounded" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card mb-4 border-line/60">
      <div className="text-sm text-slate-300">
        <span className="font-medium">No financial data tracked yet.</span>{" "}
        <Link href="/sources" className="text-accent">Add your first source</Link> to start building your completeness score.
      </div>
    </div>
  );
}

function humanYm(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}
