// Admin · Account detail page. Owner, members, data summary, audit
// history, plus the impersonation + status controls.

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AccountActions } from "./AccountActions";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

const STATUS_PILL: Record<string, string> = {
  active:    "pill-good",
  suspended: "pill-bad",
  demo:      "pill-accent",
  test:      "pill",
};

export default async function AdminAccountDetail({ params }: { params: { id: string } }) {
  const business = await prisma.business.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, email: true, name: true, createdAt: true } },
      memberships: {
        include: { user: { select: { id: true, email: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: {
          transactions: true,
          uploads: true,
          employees: true,
          consultations: true,
          notificationRules: true,
          forecastAssumptions: true,
        },
      },
    },
  });
  if (!business) notFound();

  const recentAudit = await prisma.auditLog.findMany({
    where: { targetBusinessId: params.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { actor: { select: { email: true, name: true } } },
  });

  const hasData = business._count.transactions > 0;
  const onboardedAt = business.createdAt;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-xs text-slate-500">
        <Link href="/admin" className="hover:text-slate-200">Accounts</Link>
        <span className="mx-2 text-slate-700">/</span>
        <span className="text-slate-300">{business.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold tracking-tight text-white">{business.name}</h1>
            <span className={`${STATUS_PILL[business.status] ?? "pill"} text-[10px]`}>{business.status}</span>
          </div>
          <div className="text-sm text-slate-400">
            Owned by {business.owner.email} · created {fmtDate(business.createdAt)}
          </div>
        </div>
        <AccountActions
          businessId={business.id}
          businessName={business.name}
          status={business.status}
        />
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile label="Members" value={business.memberships.length.toString()} />
        <Tile label="Transactions" value={business._count.transactions.toLocaleString()} />
        <Tile label="Uploads" value={business._count.uploads.toString()} />
        <Tile label="Employees" value={business._count.employees.toString()} />
        <Tile label="Consultations" value={business._count.consultations.toString()} />
        <Tile label="Alert rules" value={business._count.notificationRules.toString()} />
        <Tile label="Forecast assumptions" value={business._count.forecastAssumptions.toString()} />
        <Tile label="Onboarded" value={onboardedAt ? fmtDate(onboardedAt) : "—"} small />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Members */}
        <section className="lg:col-span-1 rounded-xl border border-line bg-ink-900/40 p-5">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">Members</h2>
          <ul className="space-y-2.5">
            {business.memberships.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <div className="text-slate-100 truncate">{m.user.name || m.user.email}</div>
                  <div className="text-xs text-slate-500 truncate">{m.user.email}</div>
                </div>
                <span className={`text-[10px] pill`}>{m.role}</span>
              </li>
            ))}
            {business.memberships.length === 0 ? (
              <li className="text-sm text-slate-500">No memberships.</li>
            ) : null}
          </ul>
        </section>

        {/* Onboarding signal */}
        <section className="lg:col-span-1 rounded-xl border border-line bg-ink-900/40 p-5">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">Onboarding</h2>
          <ul className="space-y-2 text-sm">
            <CheckRow done value="Account created" />
            <CheckRow done={hasData} value="First data uploaded" />
            <CheckRow done={business._count.notificationRules > 0} value="Alert rules configured" />
            <CheckRow done={business._count.consultations > 0} value="First AI consultation" />
            <CheckRow done={business._count.forecastAssumptions > 0} value="Forecast scenario added" />
            <CheckRow done={business._count.employees > 0} value="Workforce loaded" />
          </ul>
        </section>

        {/* Recent audit log */}
        <section className="lg:col-span-1 rounded-xl border border-line bg-ink-900/40 p-5">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">Recent admin activity</h2>
          {recentAudit.length === 0 ? (
            <div className="text-sm text-slate-500">No admin activity yet.</div>
          ) : (
            <ul className="space-y-2.5 text-xs">
              {recentAudit.map((a) => (
                <li key={a.id} className="border-l-2 border-line pl-3">
                  <div className="text-slate-200">{a.action}</div>
                  <div className="text-slate-500">
                    {a.actor.email} · {fmtDate(a.createdAt)}
                  </div>
                  {a.metadata ? (
                    <div className="text-slate-600 mt-0.5 font-mono text-[10px] truncate" title={a.metadata}>
                      {a.metadata}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Tile({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-ink-900/40 p-4">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</div>
      <div className={`mt-2 ${small ? "text-sm text-slate-100" : "text-2xl text-white font-bold tabular-nums tracking-tight"} leading-tight`}>
        {value}
      </div>
    </div>
  );
}

function CheckRow({ done, value }: { done: boolean; value: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span className={`w-4 h-4 rounded-full inline-flex items-center justify-center text-[10px] font-bold ${done ? "bg-good text-ink-950" : "bg-ink-700 text-slate-500"}`}>
        {done ? "✓" : ""}
      </span>
      <span className={done ? "text-slate-200" : "text-slate-500"}>{value}</span>
    </li>
  );
}
