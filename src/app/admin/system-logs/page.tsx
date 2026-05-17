// Admin · global audit log feed. Latest 200 entries.
import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return new Date(d).toLocaleString();
}

export default async function AuditLogPage() {
  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      actor:          { select: { email: true } },
      targetBusiness: { select: { id: true, name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Audit log</h1>
        <p className="text-sm text-slate-400 mt-1">
          Most recent {entries.length} admin actions.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-line bg-ink-900/40 p-8 text-center text-sm text-slate-500">
          No admin actions recorded yet.
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-ink-900/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-900/80 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="text-left px-4 py-3">When</th>
                <th className="text-left px-4 py-3">Actor</th>
                <th className="text-left px-4 py-3">Action</th>
                <th className="text-left px-4 py-3">Target</th>
                <th className="text-left px-4 py-3">Metadata</th>
                <th className="text-left px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-ink-800/60 transition">
                  <td className="px-4 py-3 text-xs text-slate-400 tabular-nums whitespace-nowrap">
                    {fmtDate(e.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300">{e.actor.email}</td>
                  <td className="px-4 py-3 text-xs text-slate-100 font-medium">{e.action}</td>
                  <td className="px-4 py-3 text-xs">
                    {e.targetBusiness ? (
                      <Link href={`/admin/accounts/${e.targetBusiness.id}`} className="text-accent hover:text-white">
                        {e.targetBusiness.name}
                      </Link>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono max-w-xs truncate" title={e.metadata ?? ""}>
                    {e.metadata ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 tabular-nums">{e.ipAddress ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
