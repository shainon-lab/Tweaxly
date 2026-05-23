// Inline review banner that explains pending sidebar-badge work and
// gives the owner a one-click jump to where the fix happens.
//
// The sidebar shows red number badges (duplicates needing review,
// triggered monitors, etc.) but on its own that's a count without
// context. This banner sits at the top of pages in the Data and
// Reports sections so owners immediately see: what's pending, what
// it means, and where to go. Auto-hides when there's nothing to do.
//
// Server component on purpose — the counts come from the same source
// as getSidebarAlerts (cheap, single query per badge), so we can
// render the explanation server-side on every navigation without an
// extra client fetch.

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";

export type ReviewBannerSurface = "transactions" | "reports" | "data";

interface Counts {
  duplicateCandidates: number;
  openDuplicateGroups: number;
}

async function fetchCounts(businessId: string): Promise<Counts> {
  const [duplicateCandidates, openDuplicateGroups] = await Promise.all([
    prisma.transaction.count({
      where: { businessId, isDuplicateCandidate: true, isExcludedFromPnl: false },
    }),
    prisma.duplicateGroup.count({ where: { businessId, status: "open" } }),
  ]);
  return { duplicateCandidates, openDuplicateGroups };
}

export default async function ReviewBanner({
  businessId,
  surface,
}: {
  businessId: string;
  surface: ReviewBannerSurface;
}) {
  const counts = await fetchCounts(businessId);
  const { duplicateCandidates, openDuplicateGroups } = counts;

  // Pick the right slice for THIS surface. Each surface gets exactly
  // ONE banner so the page doesn't get noisy with overlapping notices.
  if (surface === "transactions") {
    // On Transactions the user is one step from the fix — show how
    // many rows are flagged and what "dismiss" / "ignore" do.
    if (duplicateCandidates === 0) return null;
    return (
      <Notice
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

  if (surface === "data") {
    // On other Data pages (Sources, Import, Integration, Data Log) —
    // surface the same pending duplicates with a deep link to where
    // they're actually fixed (Transactions).
    if (duplicateCandidates === 0) return null;
    return (
      <Notice
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

  // surface === "reports"
  if (openDuplicateGroups === 0) return null;
  return (
    <Notice
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
