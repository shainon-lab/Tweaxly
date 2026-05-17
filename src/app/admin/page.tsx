// Admin · Accounts list.
//
// Shows every business in the system with owner, member count,
// onboarding signal, data presence, last activity, and status. Each
// row links to an account detail page where the super_admin can
// impersonate or change status.

import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function fmtRel(d: Date | null | undefined) {
  if (!d) return "never";
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const STATUS_PILL: Record<string, string> = {
  active:    "pill-good",
  suspended: "pill-bad",
  demo:      "pill-accent",
  test:      "pill",
};

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string };
}) {
  const where: { status?: string; OR?: Array<Record<string, unknown>> } = {};
  if (searchParams.status && searchParams.status !== "all") {
    where.status = searchParams.status;
  }
  if (searchParams.q) {
    where.OR = [
      { name: { contains: searchParams.q, mode: "insensitive" } },
      { owner: { email: { contains: searchParams.q, mode: "insensitive" } } },
    ];
  }

  const businesses = await prisma.business.findMany({
    where,
    orderBy: [{ lastActivityAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true,
      lastActivityAt: true,
      owner: { select: { id: true, email: true, name: true } },
      _count: {
        select: {
          memberships: true,
          transactions: true,
          uploads: true,
        },
      },
    },
  });

  const counts = await prisma.business.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const totals = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  const allCount = counts.reduce((acc, c) => acc + c._count._all, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Accounts</h1>
        <p className="text-sm text-slate-400 mt-1">
          Every business in the system. Click any row to inspect, change status, or view as customer.
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusChip current={searchParams.status} value="all"       count={allCount} />
          <StatusChip current={searchParams.status} value="active"    count={totals.active ?? 0} />
          <StatusChip current={searchParams.status} value="suspended" count={totals.suspended ?? 0} />
          <StatusChip current={searchParams.status} value="demo"      count={totals.demo ?? 0} />
          <StatusChip current={searchParams.status} value="test"      count={totals.test ?? 0} />
        </div>
        <form className="flex items-center gap-2">
          <input
            type="search"
            name="q"
            placeholder="Search name or email"
            defaultValue={searchParams.q ?? ""}
            className="input text-sm w-64"
          />
          {searchParams.status ? (
            <input type="hidden" name="status" value={searchParams.status} />
          ) : null}
          <button className="btn-ghost text-xs" type="submit">Search</button>
        </form>
      </div>

      <div className="rounded-xl border border-line bg-ink-900/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-900/80 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="text-left px-4 py-3">Account</th>
              <th className="text-left px-4 py-3">Owner</th>
              <th className="text-left px-4 py-3">Members</th>
              <th className="text-left px-4 py-3">Data</th>
              <th className="text-left px-4 py-3">Created</th>
              <th className="text-left px-4 py-3">Last activity</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {businesses.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                No accounts match these filters.
              </td></tr>
            ) : businesses.map((b) => {
              const hasData = b._count.transactions > 0 || b._count.uploads > 0;
              return (
                <tr key={b.id} className="hover:bg-ink-800/60 transition">
                  <td className="px-4 py-3">
                    <Link href={`/admin/accounts/${b.id}`} className="text-slate-100 font-medium hover:text-accent">
                      {b.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {b.owner.name ? <div className="text-slate-200">{b.owner.name}</div> : null}
                    <div className="text-xs text-slate-500">{b.owner.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300 tabular-nums">{b._count.memberships}</td>
                  <td className="px-4 py-3">
                    {hasData ? (
                      <span className="text-xs text-slate-300 tabular-nums">
                        {b._count.transactions.toLocaleString()} txns · {b._count.uploads} uploads
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">no data yet</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(b.createdAt)}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{fmtRel(b.lastActivityAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`${STATUS_PILL[b.status] ?? "pill"} text-[10px]`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/accounts/${b.id}`}
                      className="text-xs text-accent hover:text-white"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusChip({
  current,
  value,
  count,
}: {
  current: string | undefined;
  value: string;
  count: number;
}) {
  const active = (current ?? "all") === value;
  const label = value === "all" ? "All" : value;
  const href = value === "all" ? "/admin" : `/admin?status=${value}`;
  return (
    <Link
      href={href}
      className={`text-xs px-3 py-1.5 rounded-full border transition ${
        active
          ? "bg-accent-soft border-accent/40 text-accent"
          : "border-line text-slate-400 hover:text-slate-200 hover:border-slate-500"
      }`}
    >
      {label} <span className="tabular-nums opacity-60">· {count}</span>
    </Link>
  );
}
