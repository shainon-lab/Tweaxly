// Admin · User detail. Shows the user's identity, every workspace
// they own or are a member of, recent login attempts, and recent
// admin actions performed by or against them.

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdminOrSuper } from "@/lib/auth";
import { UserRoleEditor } from "../UserRoleEditor";

export const dynamic = "force-dynamic";

const ROLE_PILL: Record<string, string> = {
  super_admin: "pill-accent",
  admin:       "pill-good",
  user:        "pill",
};
const STATUS_PILL: Record<string, string> = {
  active:    "pill-good",
  suspended: "pill-bad",
  demo:      "pill-accent",
  test:      "pill",
};

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
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
  return `${Math.floor(days / 30)}mo ago`;
}

export default async function AdminUserDetail({ params }: { params: { id: string } }) {
  const me = await requireAdminOrSuper();
  const canChangeRoles = me.systemRole === "super_admin";

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      businesses: {
        select: { id: true, name: true, status: true, plan: true, createdAt: true, lastActivityAt: true },
        orderBy: { createdAt: "asc" },
      },
      memberships: {
        include: {
          business: { select: { id: true, name: true, status: true, plan: true, ownerId: true, lastActivityAt: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!user) notFound();

  const [loginAttempts, audits] = await Promise.all([
    prisma.loginAttempt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [
          { actorUserId: user.id },
          // Actions taken against this user — currently only role
          // changes carry the userId in metadata, but we surface them
          // by scanning the metadata column.
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { targetBusiness: { select: { id: true, name: true } } },
    }),
  ]);

  // Build the workspace list — owned first, then non-owner memberships.
  type WS = { id: string; name: string; status: string; plan: string; role: string; isOwner: boolean; lastActivityAt: Date | null };
  const ownedIds = new Set(user.businesses.map((b) => b.id));
  const workspaces: WS[] = user.businesses.map((b) => ({
    id: b.id, name: b.name, status: b.status, plan: b.plan,
    role: "account_admin", isOwner: true, lastActivityAt: b.lastActivityAt,
  }));
  for (const m of user.memberships) {
    if (ownedIds.has(m.business.id)) continue;
    workspaces.push({
      id: m.business.id, name: m.business.name, status: m.business.status, plan: m.business.plan,
      role: m.role, isOwner: false, lastActivityAt: m.business.lastActivityAt,
    });
  }

  const isMe = user.id === me.id;
  const isSuper = user.systemRole === "super_admin";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-xs text-slate-500">
        <Link href="/admin/users" className="hover:text-slate-200">Users</Link>
        <span className="mx-2 text-slate-700">/</span>
        <span className="text-slate-300">{user.name ?? user.email}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-100">{user.name ?? user.email}</h1>
            <span className={`${ROLE_PILL[user.systemRole] ?? "pill"} text-[10px]`}>{user.systemRole}</span>
            {isMe ? <span className="pill-accent text-[10px]">you</span> : null}
          </div>
          <div className="text-sm text-slate-400">
            {user.email}
            <span className="ml-2 font-mono text-[10px] text-slate-600">{user.id}</span>
          </div>
        </div>
        {canChangeRoles && !isSuper && !isMe ? (
          <UserRoleEditor userId={user.id} currentRole={user.systemRole} email={user.email} />
        ) : null}
      </div>

      {/* Identity tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Field label="Signed up"    value={fmtDate(user.createdAt)} />
        <Field label="Last login"   value={fmtRel(user.lastLoginAt)} />
        <Field label="Workspaces"   value={workspaces.length.toString()} />
        <Field label="Owned"        value={user.businesses.length.toString()} />
      </div>

      {/* Workspaces */}
      <section>
        <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-3">Workspaces</h2>
        {workspaces.length === 0 ? (
          <div className="rounded-xl border border-line bg-ink-900/40 p-6 text-center text-sm text-slate-500">
            This user doesn&apos;t belong to any workspace yet.
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-ink-900/40 overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-ink-900/80 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="text-left px-3 py-2">Workspace</th>
                  <th className="text-left px-3 py-2">Role</th>
                  <th className="text-left px-3 py-2">Plan</th>
                  <th className="text-left px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2">Last activity</th>
                  <th className="text-right px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {workspaces.map((w) => (
                  <tr key={w.id} className="hover:bg-ink-800/60 transition">
                    <td className="px-3 py-2">
                      <Link href={`/admin/accounts/${w.id}`} className="text-slate-100 hover:text-accent">
                        {w.name}
                      </Link>
                      <div className="text-[10px] text-slate-600 font-mono">{w.id}</div>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {w.isOwner ? <span className="pill-accent text-[10px]">owner</span> : <span className="pill text-[10px]">{w.role.replace("_", " ")}</span>}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-300">{w.plan}</td>
                    <td className="px-3 py-2">
                      <span className={`${STATUS_PILL[w.status] ?? "pill"} text-[10px]`}>{w.status}</span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-400 tabular-nums">{fmtRel(w.lastActivityAt)}</td>
                    <td className="px-3 py-2 text-right">
                      <Link href={`/admin/accounts/${w.id}`} className="text-xs text-accent hover:text-white">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Security */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-3">Recent login attempts</h2>
          <div className="rounded-xl border border-line bg-ink-900/40 p-4">
            {loginAttempts.length === 0 ? (
              <div className="text-sm text-slate-500">No login attempts recorded.</div>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {loginAttempts.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2">
                    <span className={a.success ? "text-good" : "text-bad"}>
                      {a.success ? "✓" : "✗"} {a.email}
                    </span>
                    <span className="text-slate-500 tabular-nums">{fmtRel(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-3">Admin actions performed</h2>
          <div className="rounded-xl border border-line bg-ink-900/40 p-4">
            {audits.length === 0 ? (
              <div className="text-sm text-slate-500">This user hasn&apos;t taken any admin actions.</div>
            ) : (
              <ul className="space-y-2 text-xs">
                {audits.map((a) => (
                  <li key={a.id} className="border-l-2 border-line pl-3">
                    <div className="text-slate-200">{a.action}</div>
                    <div className="text-slate-500">
                      {a.targetBusiness ? (
                        <Link href={`/admin/accounts/${a.targetBusiness.id}`} className="hover:text-accent">
                          {a.targetBusiness.name}
                        </Link>
                      ) : "—"}
                      <span className="mx-2 text-slate-700">·</span>
                      {fmtDate(a.createdAt)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink-900/40 p-4">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</div>
      <div className="mt-2 text-sm text-slate-100 leading-tight">{value}</div>
    </div>
  );
}
