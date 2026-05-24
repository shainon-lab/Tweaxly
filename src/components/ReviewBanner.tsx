// Inline review banner that explains pending sidebar-badge work and
// gives the owner a one-click jump to where the fix happens.
//
// The sidebar shows red number badges (duplicates needing review,
// uncategorized rows, missing data, etc.) but on its own that's a
// count without context. This banner sits at the top of pages in the
// Dashboard, Data, and Reports surfaces so owners immediately see:
// what's pending, what it means, and where to go. Stacks multiple
// notices when more than one thing needs attention; auto-hides when
// nothing is pending.
//
// Server component on purpose — the counts come from the same place
// as getSidebarAlerts (cheap, one query per badge), so we render the
// explanation server-side on every navigation without an extra client
// fetch.

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";

export type ReviewBannerSurface = "transactions" | "reports" | "data" | "dashboard";

interface Counts {
  duplicateCandidates: number;
  openDuplicateGroups: number;
  uncategorized:       number;
}

async function fetchCounts(businessId: string): Promise<Counts> {
  const [duplicateCandidates, openDuplicateGroups, uncategorized] = await Promise.all([
    prisma.transaction.count({
      where: { businessId, isDuplicateCandidate: true, isExcludedFromPnl: false },
    }),
    prisma.duplicateGroup.count({ where: { businessId, status: "open" } }),
    // Uncategorized = no categoryId OR catch-all bucket category. Matches
    // both the new "Undefined Category" and the legacy "Uncategorized"
    // names so historical data still counts.
    prisma.transaction.count({
      where: {
        businessId,
        isExcludedFromPnl: false,
        OR: [
          { categoryId: null },
          { category: { name: "Uncategorized" } },
          { category: { name: "Undefined Category" } },
        ],
      },
    }),
  ]);
  return { duplicateCandidates, openDuplicateGroups, uncategorized };
}

export default async function ReviewBanner({
  businessId,
  surface,
}: {
  businessId: string;
  surface: ReviewBannerSurface;
}) {
  const { duplicateCandidates, openDuplicateGroups, uncategorized } = await fetchCounts(businessId);

  // Build the list of notices appropriate for THIS surface. Surface
  // governs both which counts we look at AND the wording, since the
  // owner reads "you're on Transactions" copy differently from
  // "you're on Dashboard" copy.
  const notices: React.ReactNode[] = [];

  if (uncategorized > 0) {
    if (surface === "transactions") {
      // On Transactions the row IS the fix surface — no CTA needed,
      // just point at the filter chip.
      notices.push(
        <Notice
          key="uncat-tx"
          tone="warn"
          title={`${uncategorized} transaction${uncategorized === 1 ? "" : "s"} without a category`}
          body={
            <>
              Showing in <span className="text-slate-100 font-medium">Undefined Category</span> until you assign a real one. Use the <span className="text-slate-100 font-medium">Uncategorized only</span> filter above to focus on these rows, then set a category inline or in bulk.
            </>
          }
        />
      );
    } else {
      notices.push(
        <Notice
          key="uncat"
          tone="warn"
          title={`${uncategorized} transaction${uncategorized === 1 ? "" : "s"} need${uncategorized === 1 ? "s" : ""} a category`}
          body={
            <>
              These are tagged <span className="text-slate-100 font-medium">Undefined Category</span> because the upload didn't include a category column. Reports still work — that bucket shows up as its own category until you reassign. Tighten by mapping a Category column on next upload, or fix in bulk on Transactions.
            </>
          }
          cta={{ href: "/transactions?uncategorized=1", label: "Review uncategorized" }}
        />
      );
    }
  }

  if (surface === "transactions") {
    if (duplicateCandidates > 0) {
      notices.push(
        <Notice
          key="dup-tx"
          tone="warn"
          title={`${duplicateCandidates} possible duplicate${duplicateCandidates === 1 ? "" : "s"} to review`}
          body={
            <>
              Rows the system thinks may be the same transaction posted twice (same date · amount · vendor across sources). Each one has a{" "}
              <span className="text-slate-100 font-medium">possible duplicate · dismiss</span> link in its row — click to confirm both are real charges, or use the row actions to ignore one side.
            </>
          }
        />
      );
    }
  } else if (surface === "data" || surface === "dashboard") {
    if (duplicateCandidates > 0) {
      notices.push(
        <Notice
          key="dup-data"
          tone="warn"
          title={`${duplicateCandidates} transaction${duplicateCandidates === 1 ? "" : "s"} need${duplicateCandidates === 1 ? "s" : ""} duplicate review`}
          body={
            <>
              Your latest import flagged rows that may be the same transaction posted twice across sources. Review them on Transactions — confirm each is unique or dismiss the alert.
            </>
          }
          cta={{ href: "/transactions", label: "Go to Transactions" }}
        />
      );
    }
  } else if (surface === "reports") {
    if (openDuplicateGroups > 0) {
      notices.push(
        <Notice
          key="dup-reports"
          tone="warn"
          title={`${openDuplicateGroups} duplicate group${openDuplicateGroups === 1 ? "" : "s"} affecting your reports`}
          body={
            <>
              Until each group is resolved, the same transaction may be counted twice in revenue or expense totals. Review on Transactions to dismiss or merge each group.
            </>
          }
          cta={{ href: "/transactions", label: "Review duplicates" }}
        />
      );
    }
  }

  if (notices.length === 0) return null;
  return <>{notices}</>;
}

function Notice({
  tone, title, body, cta,
}: {
  tone: "warn" | "info";
  title: string;
  body: React.ReactNode;
  cta?: { href: string; label: string };
}) {
  const cls = tone === "warn"
    ? "border-warn/40 bg-warn/10"
    : "border-accent/40 bg-accent-soft/20";
  const icon = tone === "warn"
    ? <AlertTriangle size={16} className="text-warn shrink-0 mt-0.5" />
    : <AlertTriangle size={16} className="text-accent shrink-0 mt-0.5" />;
  return (
    <div className={`card mb-4 ${cls} flex items-start gap-3 flex-wrap`}>
      {icon}
      <div className="flex-1 min-w-[240px]">
        <div className="text-sm font-medium text-slate-100">{title}</div>
        <div className="text-xs text-slate-300 mt-1 leading-relaxed">{body}</div>
      </div>
      {cta ? (
        <Link
          href={cta.href}
          className="text-xs font-medium px-3 py-1.5 rounded-md border border-accent/40 text-accent hover:bg-accent-soft/30 transition inline-flex items-center gap-1.5 shrink-0"
        >
          {cta.label} <ArrowRight size={12} />
        </Link>
      ) : null}
    </div>
  );
}
