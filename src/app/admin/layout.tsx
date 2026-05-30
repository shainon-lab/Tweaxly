// Admin section layout - gates every nested route to super_admin via
// requireSuperAdmin(). Server-side enforcement; the UI/sidebar gating
// elsewhere is convenience only.
//
// Visual posture: dense, desktop-first, operational. Header sticks at
// the top with section nav + global search.

import Link from "next/link";
import { requireAdminOrSuper } from "@/lib/auth";
import AdminSearch from "@/components/admin/AdminSearch";

export const dynamic = "force-dynamic";

const NAV: { href: string; label: string }[] = [
  { href: "/admin",                  label: "Overview" },
  { href: "/admin/users",            label: "Users" },
  { href: "/admin/accounts",         label: "Accounts" },
  { href: "/admin/activity",         label: "Activity" },
  { href: "/admin/billing",          label: "Billing" },
  { href: "/admin/coupons",          label: "Coupons" },
  { href: "/admin/shared-analyses",  label: "Shared insights" },
  { href: "/admin/support",          label: "Support" },
  { href: "/admin/data-health",      label: "Data health" },
  { href: "/admin/system-logs",      label: "System logs" },
  { href: "/admin/settings",         label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminOrSuper();
  return (
    <div className="min-h-screen flex flex-col bg-ink-950">
      {/* Amber-tinted header makes it instantly obvious you're in the
          admin context. Same convention as AWS assume-role / Stripe
          Connect - a privilege-elevated bar that visually breaks from
          the standard product chrome. */}
      <header className="border-b-2 border-warn/60 bg-gradient-to-b from-warn/15 to-warn/[0.04] backdrop-blur sticky top-0 z-30 shadow-[0_1px_0_0_rgba(241,176,74,0.20)]">
        <div className="max-w-[1600px] mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5 min-w-0">
            <Link href="/admin" className="text-sm font-semibold tracking-wide text-slate-100 shrink-0 inline-flex items-center gap-2">
              <span aria-hidden="true" className="inline-block w-1.5 h-1.5 rounded-full bg-warn shadow-[0_0_8px_rgba(241,176,74,0.7)]" />
              Tweaxly · <span className="text-warn">Admin</span>
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-[13px] text-slate-400 min-w-0">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-white transition truncate">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 min-w-0">
            <div className="hidden md:block">
              <AdminSearch />
            </div>
            <div className="flex items-center gap-2 text-xs shrink-0">
              <span className="text-slate-400 hidden lg:inline">{user.email}</span>
              <span className={user.systemRole === "super_admin" ? "pill-accent" : "pill"}>
                {user.systemRole}
              </span>
              <Link href="/dashboard" className="btn-ghost text-xs">Exit admin</Link>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-[1600px] mx-auto px-6 py-6 w-full">{children}</main>
    </div>
  );
}
