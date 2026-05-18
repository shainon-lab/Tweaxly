// Admin section layout — gates every nested route to super_admin via
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
  { href: "/admin",             label: "Overview" },
  { href: "/admin/users",       label: "Users" },
  { href: "/admin/accounts",    label: "Accounts" },
  { href: "/admin/activity",    label: "Activity" },
  { href: "/admin/billing",     label: "Billing" },
  { href: "/admin/support",     label: "Support" },
  { href: "/admin/system-logs", label: "System logs" },
  { href: "/admin/settings",    label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminOrSuper();
  return (
    <div className="min-h-screen flex flex-col bg-ink-950">
      <header className="border-b border-line bg-ink-900/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5 min-w-0">
            <Link href="/admin" className="text-sm font-semibold tracking-wide text-slate-100 shrink-0">
              Tweaxly · <span className="text-accent">Admin</span>
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
