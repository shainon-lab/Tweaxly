// Admin · Shared Analyses. Cross-workspace visibility on every secure
// share link generated through the platform. Same row shape the
// workspace-scoped Account → Shared Analyses tab uses, but here the
// query is unscoped (super-admin context) and each row carries the
// owning workspace + creator so support can trace any link back to
// a customer.
//
// Auth: enforced by /admin/layout.tsx via requireAdminOrSuper().
// No second gate needed here.
//
// Actions are intentionally read-only at this tier — admins can
// follow each share to its public viewer (Open) but disable/delete
// happen through the dedicated API routes (PATCH/DELETE), exposed
// via small client buttons below.

import Link from "next/link";
import { prisma } from "@/lib/db";
import { buildShareUrl } from "@/lib/sharedAnalyses";
import AdminSharedAnalysisActions from "./AdminSharedAnalysisActions";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function fmtDateTime(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const SOURCE_LABEL: Record<string, string> = {
  consultation:         "Consultation",
  signal:               "Signal",
  forecast_explanation: "Forecast",
  insight:              "Insight",
};

export default async function AdminSharedAnalysesPage() {
  const rows = await prisma.sharedAnalysis.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id:               true,
      sourceType:       true,
      snapshotMeta:     true,
      token:            true,
      passwordHash:     true,
      expiresAt:        true,
      isActive:         true,
      viewCount:        true,
      firstViewedAt:    true,
      lastViewedAt:     true,
      createdAt:        true,
      business:         { select: { id: true, name: true } },
      createdByUser:    { select: { id: true, email: true, name: true } },
    },
  });

  const now = Date.now();
  const totals = {
    all:      rows.length,
    active:   rows.filter((r) => r.isActive && r.expiresAt.getTime() >= now).length,
    expired:  rows.filter((r) => r.expiresAt.getTime() < now).length,
    disabled: rows.filter((r) => !r.isActive && r.expiresAt.getTime() >= now).length,
    views:    rows.reduce((s, r) => s + r.viewCount, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-100">Shared analyses</h1>
          <p className="text-xs text-slate-400 mt-1">
            Every secure read-only share link generated across all workspaces.
            Snapshots are frozen at share-time and never re-derived. 200 most recent shown.
          </p>
        </div>
      </div>

      {/* Top-line counters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <AdminStat label="Total"    value={totals.all.toLocaleString()} />
        <AdminStat label="Active"   value={totals.active.toLocaleString()}   tone="good" />
        <AdminStat label="Expired"  value={totals.expired.toLocaleString()}  tone="muted" />
        <AdminStat label="Disabled" value={totals.disabled.toLocaleString()} tone="warn" />
        <AdminStat label="Total views" value={totals.views.toLocaleString()} />
      </div>

      {rows.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-sm text-slate-300">No shared analyses created yet.</div>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-base w-full">
            <thead>
              <tr>
                <th>Workspace</th>
                <th>Creator</th>
                <th>Type</th>
                <th>Title</th>
                <th className="text-right">Views</th>
                <th>Created</th>
                <th>Expires</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const expired = r.expiresAt.getTime() < now;
                const status: "active" | "expired" | "disabled" =
                  expired       ? "expired"  :
                  !r.isActive   ? "disabled" :
                                  "active";
                const meta = (r.snapshotMeta ?? {}) as { title?: string; question?: string };
                const title =
                  (typeof meta.title === "string" && meta.title) ||
                  (typeof meta.question === "string" && meta.question) ||
                  "Shared analysis";
                const creator = r.createdByUser?.name ?? r.createdByUser?.email ?? "(deleted user)";
                return (
                  <tr key={r.id}>
                    <td className="text-slate-200">
                      <Link
                        href={`/admin/accounts/${r.business.id}`}
                        className="hover:text-accent transition"
                      >
                        {r.business.name}
                      </Link>
                    </td>
                    <td className="text-slate-300 t-meta" title={r.createdByUser?.email ?? ""}>
                      {creator}
                    </td>
                    <td>
                      <span className="pill">{SOURCE_LABEL[r.sourceType] ?? r.sourceType}</span>
                    </td>
                    <td className="text-slate-200 max-w-[320px]">
                      <div className="truncate" title={title}>{title}</div>
                      {r.passwordHash ? (
                        <div className="t-meta uppercase tracking-wide text-slate-500 mt-0.5">
                          Password-protected
                        </div>
                      ) : null}
                    </td>
                    <td className="text-right text-slate-300 tabular-nums">
                      {r.viewCount}
                      {r.lastViewedAt ? (
                        <div className="t-meta text-slate-500" title={`Last viewed ${fmtDateTime(r.lastViewedAt)}`}>
                          last {fmtDate(r.lastViewedAt)}
                        </div>
                      ) : null}
                    </td>
                    <td className="text-slate-300 t-meta" title={fmtDateTime(r.createdAt)}>
                      {fmtDate(r.createdAt)}
                    </td>
                    <td className="text-slate-300 t-meta" title={fmtDateTime(r.expiresAt)}>
                      {fmtDate(r.expiresAt)}
                    </td>
                    <td>
                      <StatusPill status={status} />
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <AdminSharedAnalysisActions
                        id={r.id}
                        url={buildShareUrl(r.token)}
                        isActive={r.isActive}
                        expired={expired}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdminStat({
  label, value, tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn" | "bad" | "muted";
}) {
  const toneClass =
    tone === "good"  ? "text-good" :
    tone === "warn"  ? "text-warn" :
    tone === "bad"   ? "text-bad"  :
    tone === "muted" ? "text-slate-400" :
                       "text-slate-100";
  return (
    <div className="card">
      <div className="t-meta uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`t-section font-semibold mt-1 tabular-nums ${toneClass}`}>{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: "active" | "expired" | "disabled" }) {
  if (status === "active")   return <span className="pill-good">Active</span>;
  if (status === "expired")  return <span className="pill-warn">Expired</span>;
  return <span className="pill">Disabled</span>;
}
