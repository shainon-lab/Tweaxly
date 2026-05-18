// Admin · Settings. Surfaces the small set of operator-level
// preferences that exist today. Most of the heavy admin settings
// (provider keys, webhook URLs, slack notifications) belong on this
// page once the corresponding systems are wired up.

import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [superAdmins, businessCount, userCount] = await Promise.all([
    prisma.user.findMany({
      where: { systemRole: "super_admin" },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, name: true, createdAt: true, lastLoginAt: true },
    }),
    prisma.business.count(),
    prisma.user.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-100">Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Operator-level preferences and platform metadata.
        </p>
      </div>

      <section>
        <h2 className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Super admins</h2>
        <div className="rounded-xl border border-line bg-ink-900/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-900/80 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="text-left px-3 py-2">User</th>
                <th className="text-left px-3 py-2">Promoted</th>
                <th className="text-left px-3 py-2">Last login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {superAdmins.map((u) => (
                <tr key={u.id}>
                  <td className="px-3 py-2 text-slate-200">
                    {u.name ?? u.email}
                    <div className="text-[11px] text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-400">{u.createdAt.toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-xs text-slate-400">{u.lastLoginAt ? u.lastLoginAt.toLocaleString() : "never"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-3 py-2 text-[11px] text-slate-500 border-t border-line">
            New super admins are promoted via DB update (no UI yet). The seeded
            super-admin email is auto-promoted on first signup.
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Platform</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Tile label="Total accounts" value={businessCount.toLocaleString()} />
          <Tile label="Total users"    value={userCount.toLocaleString()} />
          <Tile label="Node"           value={process.version} mono />
          <Tile label="Environment"    value={process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "—"} mono />
        </div>
      </section>

      <section>
        <h2 className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Integrations</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <IntegrationCard
            name="Resend"
            description="Transactional email (password resets)"
            connected={!!process.env.RESEND_API_KEY}
          />
          <IntegrationCard
            name="Anthropic Claude"
            description="AI advisor backend"
            connected={!!process.env.ANTHROPIC_API_KEY}
          />
          <IntegrationCard name="Stripe"          description="Subscriptions, invoices, payments" connected={false} planned />
          <IntegrationCard name="Support tool"    description="Tickets, conversations, feedback"  connected={false} planned />
        </div>
      </section>

      <section className="text-xs text-slate-500">
        Looking for the audit trail? It moved to{" "}
        <Link href="/admin/system-logs" className="text-accent hover:underline">System logs</Link>.
      </section>
    </div>
  );
}

function Tile({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-ink-900/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</div>
      <div className={`mt-1.5 text-xl text-slate-100 tabular-nums ${mono ? "font-mono text-sm" : "font-bold"}`}>{value}</div>
    </div>
  );
}

function IntegrationCard({
  name, description, connected, planned,
}: { name: string; description: string; connected: boolean; planned?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-ink-900/40 p-4 flex items-start justify-between gap-3">
      <div>
        <div className="text-sm font-medium text-slate-100">{name}</div>
        <div className="text-xs text-slate-500 mt-0.5">{description}</div>
      </div>
      <span
        className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
          connected
            ? "border-good/40 bg-good/10 text-good"
            : planned
            ? "border-line text-slate-500"
            : "border-line text-slate-500"
        }`}
      >
        {connected ? "connected" : planned ? "planned" : "not set"}
      </span>
    </div>
  );
}
