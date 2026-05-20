// Admin → Data Health.
//
// Per-business data-integrity dashboard. Surfaces:
//   • confidence score (0-100) + component breakdown
//   • reconciliation findings (sums that don't match)
//   • global health counters across all businesses
//
// Admin-only — gated by the /admin/layout.tsx requireAdminOrSuper.

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { prisma } from "@/lib/db";
import { buildDataConfidence, type ConfidenceReport } from "@/lib/dataConfidence";
import { reconcileAllMonths, type ReconciliationFinding } from "@/lib/reconcile";

export const dynamic = "force-dynamic";

export default async function DataHealthPage({
  searchParams,
}: { searchParams: Promise<{ b?: string }> }) {
  const sp = await searchParams;
  const businessId = sp.b ?? null;

  // Top-of-page global counters.
  const [businessCount, txnTotal, uncatTotal, dupTotal, fxIssueTotal] = await Promise.all([
    prisma.business.count(),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { categoryId: null } }),
    prisma.transaction.count({ where: { isDuplicateCandidate: true } }),
    prisma.transaction.count({
      where: { rateFetchStatus: { in: ["needs_review", "failed", "missing"] } },
    }),
  ]);

  // Per-business confidence + reconciliation when a specific business
  // is selected. Otherwise show the top 12 businesses by data volume
  // so the admin can drill into the loudest ones first.
  let detail: { biz: { id: string; name: string }; conf: ConfidenceReport; findings: ReconciliationFinding[] } | null = null;
  if (businessId) {
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true },
    });
    if (biz) {
      const [conf, findings] = await Promise.all([
        buildDataConfidence(biz.id),
        reconcileAllMonths(biz.id),
      ]);
      detail = { biz, conf, findings };
    }
  }

  const topBusinesses = await prisma.business.findMany({
    orderBy: { lastActivityAt: "desc" },
    take: 12,
    select: {
      id: true, name: true, currency: true,
      _count: { select: { transactions: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Data health"
        subtitle="Confidence, reconciliation, and integrity signals across every business."
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Tile label="Businesses" value={businessCount.toLocaleString("en-US")} />
        <Tile label="Transactions" value={txnTotal.toLocaleString("en-US")} />
        <Tile
          label="Uncategorized"
          value={uncatTotal.toLocaleString("en-US")}
          tone={uncatTotal > 0 ? "warn" : "ok"}
        />
        <Tile
          label="Duplicates flagged"
          value={dupTotal.toLocaleString("en-US")}
          tone={dupTotal > 0 ? "warn" : "ok"}
        />
        <Tile
          label="FX issues"
          value={fxIssueTotal.toLocaleString("en-US")}
          tone={fxIssueTotal > 0 ? "bad" : "ok"}
        />
      </div>

      {detail ? <DetailCard detail={detail} /> : null}

      <div className="card">
        <div className="font-medium mb-3">
          Businesses{businessId ? " (pick another)" : ""}
        </div>
        <div className="text-xs text-slate-400 mb-3">
          Top 12 by most recent activity. Click a row to drill into its
          confidence breakdown and per-month reconciliation findings.
        </div>
        <table className="table-base">
          <thead>
            <tr>
              <th>Name</th>
              <th className="text-right">Transactions</th>
              <th>Base currency</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {topBusinesses.map((b) => (
              <tr key={b.id}>
                <td className="font-medium text-slate-100">{b.name}</td>
                <td className="text-right tabular-nums">{b._count.transactions.toLocaleString("en-US")}</td>
                <td className="text-slate-300">{b.currency}</td>
                <td className="text-right">
                  <Link
                    href={`/admin/data-health?b=${b.id}`}
                    className="btn-ghost text-xs"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Tile({ label, value, tone }: {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "bad";
}) {
  const toneClass =
    tone === "bad" ? "text-bad" :
    tone === "warn" ? "text-warn" : "text-slate-100";
  return (
    <div className="card-tight">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-2 text-xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}

function DetailCard({
  detail,
}: {
  detail: {
    biz: { id: string; name: string };
    conf: ConfidenceReport;
    findings: ReconciliationFinding[];
  };
}) {
  const { biz, conf, findings } = detail;
  const bandTone =
    conf.band === "high" ? "text-good" :
    conf.band === "medium" ? "text-warn" : "text-bad";

  return (
    <div className="card mb-6">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
        <div className="font-medium">
          {biz.name}
          <span className="ml-2 text-xs text-slate-400">data confidence</span>
        </div>
        <Link href="/admin/data-health" className="text-xs text-accent hover:underline">Close</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="card-tight">
          <div className="text-xs uppercase tracking-wide text-slate-400">Score</div>
          <div className={`mt-2 text-3xl font-bold ${bandTone}`}>
            {conf.score}
            <span className="text-base text-slate-400 ml-1">/100</span>
          </div>
          <div className={`text-xs mt-1 uppercase tracking-wide ${bandTone}`}>{conf.band}</div>
        </div>
        {conf.components.map((c) => (
          <div key={c.key} className="card-tight">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              {c.key.replace(/_/g, " ")}
            </div>
            <div className="mt-2 text-xl font-semibold text-slate-100">
              {Math.round(c.score)}
              <span className="text-xs text-slate-400 ml-1">
                (weight {Math.round(c.weight * 100)}%)
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1 leading-snug">{c.detail}</div>
          </div>
        ))}
      </div>

      {conf.warnings.length > 0 ? (
        <div className="rounded-lg border border-warn/30 bg-warn/10 p-3 mb-4">
          <div className="text-xs uppercase tracking-wide text-warn mb-2">Warnings</div>
          <ul className="space-y-1 text-sm text-slate-200">
            {conf.warnings.map((w, i) => <li key={i}>• {w}</li>)}
          </ul>
        </div>
      ) : null}

      <div className="font-medium text-sm mb-2 mt-4">Reconciliation</div>
      <div className="text-xs text-slate-400 mb-3">
        Cross-checks: income vs Σ revenue categories, net identity, and FX integrity for every month with data.
      </div>
      {findings.length === 0 ? (
        <div className="rounded-lg border border-good/30 bg-good/5 p-3 text-sm text-good">
          ✓ All months reconcile within tolerance.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Level</th>
                <th>Month</th>
                <th>Check</th>
                <th>Detail</th>
                <th className="text-right">Drift</th>
              </tr>
            </thead>
            <tbody>
              {findings.map((f, i) => (
                <tr key={i}>
                  <td>
                    <span className={f.level === "error" ? "pill-bad" : f.level === "warn" ? "pill-warn" : "pill"}>
                      {f.level}
                    </span>
                  </td>
                  <td className="font-mono text-xs">{f.ym ?? "—"}</td>
                  <td className="text-xs text-slate-300">{f.check}</td>
                  <td className="text-xs text-slate-400">{f.message}</td>
                  <td className="text-right text-xs tabular-nums">
                    {Math.abs(f.drift) < 0.005 ? "≈0" : f.drift.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
