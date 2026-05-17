// Admin · Accounts list. Every business in the system with filters,
// search, and Customer 360 quick actions per row.

import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

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

function daysAgoDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

const STATUS_PILL: Record<string, string> = {
  active:    "pill-good",
  suspended: "pill-bad",
  demo:      "pill-accent",
  test:      "pill",
};

type Search = {
  q?: string;
  status?: string;
  plan?: string;
  trial?: string;
  activity?: string;
  dataStatus?: string;
  signupWithin?: string;
};

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const where: Prisma.BusinessWhereInput = {};
  const ANDs: Prisma.BusinessWhereInput[] = [];
  const now = new Date();

  if (searchParams.status && searchParams.status !== "all") {
    where.status = searchParams.status;
  }
  if (searchParams.plan && searchParams.plan !== "all") {
    where.plan = searchParams.plan;
  }
  if (searchParams.trial === "1") {
    where.trialEndsAt = { gte: now };
  }
  if (searchParams.activity === "recent") {
    where.lastActivityAt = { gte: daysAgoDate(7) };
  } else if (searchParams.activity === "inactive") {
    ANDs.push({
      OR: [
        { lastActivityAt: null, createdAt: { lt: daysAgoDate(30) } },
        { lastActivityAt: { lt: daysAgoDate(30) } },
      ],
    });
  }
  if (searchParams.dataStatus === "none") {
    where.transactions = { none: {} };
  } else if (searchParams.dataStatus === "active") {
    where.transactions = { some: {} };
  }
  if (searchParams.signupWithin) {
    const m = searchParams.signupWithin.match(/^(\d+)d$/);
    if (m) where.createdAt = { gte: daysAgoDate(Number(m[1])) };
  }
  if (searchParams.q) {
    const q = searchParams.q;
    ANDs.push({
      OR: [
        { id:   { contains: q } },
        { name: { contains: q, mode: "insensitive" } },
        { owner: { email: { contains: q, mode: "insensitive" } } },
        { owner: { name:  { contains: q, mode: "insensitive" } } },
      ],
    });
  }
  if (ANDs.length > 0) where.AND = ANDs;

  const businesses = await prisma.business.findMany({
    where,
    orderBy: [{ lastActivityAt: "desc" }, { createdAt: "desc" }],
    take: 200,
    select: {
      id: true,
      name: true,
      status: true,
      plan: true,
      trialEndsAt: true,
      createdAt: true,
      lastActivityAt: true,
      currency: true,
      owner: { select: { id: true, email: true, name: true, lastLoginAt: true } },
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

  const baseQuery: Record<string, string | undefined> = { ...searchParams };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Accounts</h1>
          <p className="text-sm text-slate-400 mt-1">
            Every business in the system. Click any row for the Customer 360.
          </p>
        </div>
        <form className="flex items-center gap-2" action="/admin/accounts">
          <input
            type="search"
            name="q"
            placeholder="Search name, email, or account ID"
            defaultValue={searchParams.q ?? ""}
            className="input text-sm w-72"
          />
          {Object.entries(baseQuery)
            .filter(([k, v]) => v && k !== "q")
            .map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
          <button className="btn-ghost text-xs" type="submit">Search</button>
        </form>
      </div>

      <div className="space-y-2.5">
        <FilterRow label="Status">
          <Chip name="status" cur={searchParams.status} val={undefined} label="All"       count={allCount}              base={baseQuery} />
          <Chip name="status" cur={searchParams.status} val="active"    label="Active"    count={totals.active ?? 0}    base={baseQuery} />
          <Chip name="status" cur={searchParams.status} val="suspended" label="Suspended" count={totals.suspended ?? 0} base={baseQuery} />
          <Chip name="status" cur={searchParams.status} val="demo"      label="Demo"      count={totals.demo ?? 0}      base={baseQuery} />
          <Chip name="status" cur={searchParams.status} val="test"      label="Test"      count={totals.test ?? 0}      base={baseQuery} />
        </FilterRow>
        <FilterRow label="Activity">
          <Chip name="activity" cur={searchParams.activity} val={undefined} label="Any" base={baseQuery} />
          <Chip name="activity" cur={searchParams.activity} val="recent"    label="Recently active · 7d" base={baseQuery} />
          <Chip name="activity" cur={searchParams.activity} val="inactive"  label="Inactive ≥ 30d" base={baseQuery} />
        </FilterRow>
        <FilterRow label="Data">
          <Chip name="dataStatus" cur={searchParams.dataStatus} val={undefined} label="Any" base={baseQuery} />
          <Chip name="dataStatus" cur={searchParams.dataStatus} val="none"     label="No data" base={baseQuery} />
          <Chip name="dataStatus" cur={searchParams.dataStatus} val="active"   label="Has data" base={baseQuery} />
        </FilterRow>
        <FilterRow label="Lifecycle">
          <Chip name="trial"        cur={searchParams.trial}        val={undefined} label="Any" base={baseQuery} />
          <Chip name="trial"        cur={searchParams.trial}        val="1"   label="Trial active" base={baseQuery} />
          <Chip name="signupWithin" cur={searchParams.signupWithin} val="7d"  label="Signed up · 7d" base={baseQuery} />
          <Chip name="signupWithin" cur={searchParams.signupWithin} val="30d" label="Signed up · 30d" base={baseQuery} />
        </FilterRow>
      </div>

      <div className="rounded-xl border border-line bg-ink-900/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-900/80 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="text-left px-4 py-3">Account</th>
              <th className="text-left px-4 py-3">Owner</th>
              <th className="text-left px-4 py-3">Plan</th>
              <th className="text-left px-4 py-3">Users</th>
              <th className="text-left px-4 py-3">Data</th>
              <th className="text-left px-4 py-3">Signup</th>
              <th className="text-left px-4 py-3">Last login</th>
              <th className="text-left px-4 py-3">Last activity</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {businesses.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-500">
                  No accounts match these filters.
                </td>
              </tr>
            ) : (
              businesses.map((b) => {
                const dataStatus =
                  b._count.transactions > 50 ? "active" :
                  b._count.transactions > 0  ? "partial" :
                                                "none";
                const dataLabel =
                  dataStatus === "active"  ? `${b._count.transactions.toLocaleString()} txns` :
                  dataStatus === "partial" ? `${b._count.transactions} txns · partial` :
                                              "no data yet";
                const dataTone =
                  dataStatus === "active"  ? "text-good"  :
                  dataStatus === "partial" ? "text-warn"  :
                                              "text-slate-500";
                const trialActive = b.trialEndsAt && b.trialEndsAt.getTime() > Date.now();
                return (
                  <tr key={b.id} className="hover:bg-ink-800/60 transition">
                    <td className="px-4 py-3">
                      <Link href={`/admin/accounts/${b.id}`} className="text-slate-100 font-medium hover:text-accent">
                        {b.name}
                      </Link>
                      <div className="text-[10px] text-slate-600 mt-0.5 font-mono">{b.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      {b.owner.name ? <div className="text-slate-200 text-sm">{b.owner.name}</div> : null}
                      <div className="text-xs text-slate-500">{b.owner.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-200">{b.plan}</span>
                      {trialActive ? <div className="text-[10px] text-accent mt-0.5">trial ends {fmtDate(b.trialEndsAt)}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-slate-300 tabular-nums">{b._count.memberships}</td>
                    <td className={`px-4 py-3 text-xs ${dataTone}`}>{dataLabel}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(b.createdAt)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{fmtRel(b.owner.lastLoginAt)}</td>
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
              })
            )}
          </tbody>
        </table>
        {businesses.length === 200 ? (
          <div className="px-4 py-2 text-[11px] text-slate-500 border-t border-line text-center">
            Showing first 200 results. Narrow the filters to see more.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium w-20 shrink-0">{label}</span>
      {children}
    </div>
  );
}

function Chip({
  name, cur, val, label, count, base,
}: {
  name: string;
  cur: string | undefined;
  val: string | undefined;
  label: string;
  count?: number;
  base: Record<string, string | undefined>;
}) {
  const active = (cur ?? undefined) === (val ?? undefined);
  const next: Record<string, string | undefined> = { ...base, [name]: val };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) {
    if (v) qs.set(k, v);
  }
  const href = `/admin/accounts${qs.toString() ? `?${qs.toString()}` : ""}`;
  return (
    <Link
      href={href}
      className={`text-xs px-3 py-1.5 rounded-full border transition ${
        active
          ? "bg-accent-soft border-accent/40 text-accent"
          : "border-line text-slate-400 hover:text-slate-200 hover:border-slate-500"
      }`}
    >
      {label}
      {typeof count === "number" ? <span className="tabular-nums opacity-60"> · {count}</span> : null}
    </Link>
  );
}
