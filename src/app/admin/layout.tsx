// Admin section layout — gates every nested route to super_admin via
// requireSuperAdmin(). Server-side enforcement; the UI/sidebar gating
// elsewhere is convenience only.

import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSuperAdmin();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line bg-ink-900/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-sm font-semibold tracking-wide text-white">
              Tweaxly · <span className="text-accent">Admin</span>
            </Link>
            <nav className="hidden md:flex items-center gap-5 text-sm text-slate-300">
              <Link href="/admin" className="hover:text-white transition">Accounts</Link>
              <Link href="/admin/audit" className="hover:text-white transition">Audit log</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">{user.email}</span>
            <span className="pill-accent">super_admin</span>
            <Link href="/dashboard" className="btn-ghost text-xs">Exit admin</Link>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">{children}</main>
    </div>
  );
}
