// Admin · Users. The User is the primary entity here - each row is
// one login identity with all the workspaces they own or belong to
// inline. From here a super_admin can promote / demote between
// 'user' and 'admin'. Super-admin rows are read-only (no role change
// from this surface).

import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdminOrSuper } from "@/lib/auth";
import { UserRoleEditor } from "./UserRoleEditor";

export const dynamic = "force-dynamic";

function fmtDate(d: Date | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function fmtRel(d: Date | null | undefined) {
  if (!d) return "never";
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

const ROLE_PILL: Record<string, string> = {
  super_admin: "pill-accent",
  admin:       "pill-good",
  user:        "pill",
};

type Search = {
  q?: string;
  role?: string;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const me = await requireAdminOrSuper();
  const canChangeRoles = me.systemRole === "super_admin";

  const where: Record<string, unknown> = {};
  if (searchParams.role && searchParams.role !== "all") {
    where.systemRole = searchParams.role;
  }
  if (searchParams.q) {
    const q = searchParams.q;
    where.OR = [
      { id:    { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
      { name:  { contains: q, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ systemRole: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      email: true,
      name: true,
      systemRole: true,
      lastLoginAt: true,
      createdAt: true,
      businesses: {
        select: { id: true, name: true, status: true, plan: true },
        orderBy: { createdAt: "asc" },
      },
      memberships: {
        select: {
          role: true,
          status: true,
          business: { select: { id: true, name: true, status: true, ownerId: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const roleCounts = await prisma.user.groupBy({
    by: ["systemRole"],
    _count: { _all: true },
  });
  const totals = Object.fromEntries(roleCounts.map((c) => [c.systemRole, c._count._all]));
  const allCount = roleCounts.reduce((acc, c) => acc + c._count._all, 0);

  const baseQuery: Record<string, string | undefined> = { ...searchParams };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-100">Users</h1>
          <p className="text-xs text-slate-400 mt-1">
            Every login identity. Each user can own multiple workspaces and be invited to others.
            {canChangeRoles
              ? " Super admin: promote a user to admin or revert back from this page."
              : " Role changes require super admin."}
          </p>
        </div>
        <form className="flex items-center gap-2" action="/admin/users">
          <input
            type="search"
            name="q"
            placeholder="Search name, email, user ID"
            defaultValue={searchParams.q ?? ""}
            className="h-8 px-3 rounded-md border border-line bg-ink-900/60 text-[13px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent/50 w-64"
          />
          {Object.entries(baseQuery)
            .filter(([k, v]) => v && k !== "q")
            .map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          <button className="btn-ghost text-xs h-8" type="submit">Search</button>
        </form>
      </div>

      {/* Role filter chips */}
      <div className="flex items-center gap-1.5 flex-wrap sticky top-12 z-10 bg-ink-950/95 backdrop-blur py-2 -my-2 border-y border-line/40">
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium w-14 shrink-0">Role</span>
        <Chip name="role" cur={searchParams.role} val={undefined}    label="All"          count={allCount}                base={baseQuery} />
        <Chip name="role" cur={searchParams.role} val="super_admin" label="Super admin"  count={totals.super_admin ?? 0} base={baseQuery} />
        <Chip name="role" cur={searchParams.role} val="admin"        label="Admin"        count={totals.admin ?? 0}       base={baseQuery} />
        <Chip name="role" cur={searchParams.role} val="user"         label="User"         count={totals.user ?? 0}        base={baseQuery} />
      </div>

      <div className="rounded-lg border border-line bg-ink-900/40 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-ink-900/80 text-[10px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="text-left px-3 py-2">User</th>
              <th className="text-left px-3 py-2">Role</th>
              <th className="text-left px-3 py-2">Workspaces</th>
              <th className="text-left px-3 py-2">Last login</th>
              <th className="text-left px-3 py-2">Signed up</th>
              <th className="text-right px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">
                  No users match these filters.
                </td>
              </tr>
            ) : users.map((u) => {
              // Workspaces the user can access - combine owned + active memberships.
              const ownedIds = new Set(u.businesses.map((b) => b.id));
              const allWs: { id: string; name: string; status: string; isOwner: boolean }[] = [];
              for (const b of u.businesses) {
                allWs.push({ id: b.id, name: b.name, status: b.status, isOwner: true });
              }
              for (const m of u.memberships) {
                if (ownedIds.has(m.business.id)) continue;
                if (m.status !== "active") continue;
                allWs.push({ id: m.business.id, name: m.business.name, status: m.business.status, isOwner: false });
              }
              const isMe = u.id === me.id;
              const isSuper = u.systemRole === "super_admin";
              return (
                <tr key={u.id} className="hover:bg-ink-800/60 transition align-top">
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/users/${u.id}`} className="text-slate-100 font-medium hover:text-accent">
                      {u.name ?? u.email}
                    </Link>
                    <div className="text-[11px] text-slate-500">{u.email}</div>
                    <div className="text-[10px] text-slate-600 font-mono mt-0.5">{u.id}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`${ROLE_PILL[u.systemRole] ?? "pill"} text-[10px]`}>
                      {u.systemRole}
                    </span>
                    {isMe ? <div className="text-[10px] text-accent mt-0.5">(you)</div> : null}
                  </td>
                  <td className="px-3 py-2.5">
                    {allWs.length === 0 ? (
                      <span className="text-xs text-slate-500">none</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {allWs.map((w) => (
                          <Link
                            key={w.id}
                            href={`/admin/accounts/${w.id}`}
                            className="inline-flex items-center gap-1.5 rounded border border-line bg-ink-900/60 px-1.5 py-0.5 text-[11px] text-slate-200 hover:text-white hover:border-slate-500 transition"
                            title={`${w.status} · ${w.isOwner ? "owner" : "member"}`}
                          >
                            <span>{w.name}</span>
                            {w.isOwner ? null : <span className="text-[9px] text-slate-500">member</span>}
                          </Link>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-400 tabular-nums">{fmtRel(u.lastLoginAt)}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-400">{fmtDate(u.createdAt)}</td>
                  <td className="px-3 py-2.5 text-right">
                    {canChangeRoles && !isSuper && !isMe ? (
                      <UserRoleEditor userId={u.id} currentRole={u.systemRole} email={u.email} />
                    ) : (
                      <span className="text-[10px] text-slate-600">
                        {isSuper ? "super-admin protected" : isMe ? "self" : "view only"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-3 py-1.5 text-[10px] text-slate-500 border-t border-line">
          {users.length} user{users.length === 1 ? "" : "s"}
        </div>
      </div>
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
  const href = `/admin/users${qs.toString() ? `?${qs.toString()}` : ""}`;
  return (
    <Link
      href={href}
      className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
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
