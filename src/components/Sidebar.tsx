"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  MessageSquare,
  TrendingUp,
  FileText,
  SlidersHorizontal,
  CircleUser,
  Shield,
  type LucideIcon,
} from "lucide-react";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import BusinessSwitcher, { type SwitcherWorkspace } from "./BusinessSwitcher";
import { useT } from "@/lib/i18n/client";

type AlertKey = "transactions" | "insights" | "businessSignals";

// Sidebar nav is intentionally calm — thin outline icons (lucide), no
// emoji, no filled glyphs, no decorative color. The icons act as quiet
// orientation anchors and never compete with the AI-driven sections
// inside the pages. All icons share the same stroke weight and size.
// Nav labels are translation keys (resolved via useT() inside the
// component) so the entire sidebar re-renders in the active locale.
const NAV: { href: string; tKey: string; Icon: LucideIcon; alertKey?: AlertKey }[] = [
  { href: "/dashboard",        tKey: "nav.overview", Icon: LayoutDashboard },
  { href: "/business-signals", tKey: "nav.signals",  Icon: Activity,         alertKey: "businessSignals" },
  { href: "/consultation",     tKey: "nav.advisory", Icon: MessageSquare },
  { href: "/forecast",         tKey: "nav.forecast", Icon: TrendingUp },
  { href: "/report",           tKey: "nav.reports",  Icon: FileText,         alertKey: "insights" },
  // Workforce Planning lives inside Forecast as a sub-tab now — the
  // platform is business-intelligence, not HR, so workforce is a
  // financial-planning lever rather than a standalone destination.
  // Data, Integration, and Notifications all live inside Settings
  // as sub-tabs. The transactions alert badge surfaces on Settings
  // so duplicate-review counts stay visible in the sidebar.
  { href: "/settings",         tKey: "nav.settings", Icon: SlidersHorizontal, alertKey: "transactions" },
  { href: "/account",          tKey: "nav.account",  Icon: CircleUser },
];

export type SidebarAlerts = { transactions?: number; insights?: number; businessSignals?: number };

export default function Sidebar({
  businessName,
  businessId,
  logoData,
  alerts,
  systemRole,
  workspaces,
}: {
  businessName: string;
  businessId?: string;
  logoData?: string | null;
  alerts?: SidebarAlerts;
  systemRole?: string;
  workspaces?: SwitcherWorkspace[];
}) {
  const isSuperAdmin = systemRole === "super_admin";
  const isAdminOrSuper = systemRole === "admin" || systemRole === "super_admin";
  const t = useT();
  const path = usePathname();
  const hasCustomLogo = !!logoData;
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the drawer whenever the user navigates so it doesn't sit open
  // over the new page.
  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

  // Lock body scroll while the drawer is open on mobile.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile hamburger toggle — sits in the top-left corner over the
          main pane. Hidden on lg+ where the sidebar is always visible. */}
      <button
        type="button"
        className="lg:hidden fixed top-3 left-3 z-30 inline-flex items-center justify-center w-10 h-10 rounded-md border border-line bg-ink-900/90 backdrop-blur text-slate-200 shadow-lg"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        aria-expanded={mobileOpen}
      >
        <span className="text-xl leading-none">☰</span>
      </button>

      {/* Backdrop — shows on mobile when the drawer is open. Click to close. */}
      {mobileOpen ? (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={`w-64 shrink-0 border-r border-line bg-ink-900/95 lg:bg-ink-900/70 flex flex-col
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-200
          lg:static lg:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* TWEAXLY is the platform brand and always renders here. The business
            slot below shows either the uploaded business logo or the business
            name as a fallback. */}
        <div className="px-4 py-5 border-b border-line bg-brand-navy relative">
          <Logo size="md" showTagline />
          {hasCustomLogo ? (
            <div className="mt-3 flex items-center min-h-[40px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoData!}
                alt={businessName}
                className="max-h-10 max-w-full object-contain"
              />
            </div>
          ) : null}
          {/* Workspace switcher — replaces the static business-name label.
              Always visible so users with multiple workspaces have a
              one-click switch + 'Create new workspace' affordance. */}
          {workspaces && workspaces.length > 0 ? (
            <div className="mt-3">
              <BusinessSwitcher
                current={businessId ? { id: businessId, name: businessName } : null}
                workspaces={workspaces}
              />
            </div>
          ) : (
            <div className="text-xs text-slate-400 mt-3 truncate" title={businessName}>
              {businessName}
            </div>
          )}
          {/* Mobile-only close button inside the drawer header */}
          <button
            type="button"
            className="lg:hidden absolute top-3 right-3 w-8 h-8 inline-flex items-center justify-center text-slate-300 hover:text-white rounded-md"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <span className="text-lg leading-none">✕</span>
          </button>
        </div>
        <nav className="px-2 py-3 flex-1 space-y-0.5 overflow-y-auto">
          {NAV.map((n) => {
            // Business Settings owns /settings AND the data sub-tab
            // routes (/manual-data, /transactions, /data-log) AND the
            // /integration route that still exists as a backwards-
            // compatible landing for the Integration tab. Reports & Charts
            // owns /report, /data-flow, /insights via ReportsTabs.
            const settingsRoutes = [
              "/settings", "/manual-data", "/transactions", "/data-log", "/integration",
            ];
            const reportsRoutes = ["/report", "/data-flow", "/insights"];
            // Forecast owns /forecast plus /workforce (Workforce
            // Planning sub-tab) plus /employees (Edit Roster drill-
            // down kept inside the Forecast nav group).
            const forecastRoutes = ["/forecast", "/workforce", "/employees"];
            const inSettingsGroup = settingsRoutes.some((r) => path === r || path.startsWith(r + "/"));
            const inReportsGroup = reportsRoutes.some((r) => path === r || path.startsWith(r + "/"));
            const inForecastGroup = forecastRoutes.some((r) => path === r || path.startsWith(r + "/"));
            const active =
              n.href === "/settings" ? inSettingsGroup :
              n.href === "/report"   ? inReportsGroup :
              n.href === "/forecast" ? inForecastGroup :
              path === n.href || path.startsWith(n.href + "/");
            const alertCount = n.alertKey ? alerts?.[n.alertKey] ?? 0 : 0;
            const Icon = n.Icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition ${
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-slate-300 hover:bg-ink-700 hover:text-slate-100"
                }`}
              >
                <Icon
                  size={16}
                  strokeWidth={1.5}
                  className={`shrink-0 ${active ? "text-accent" : "text-slate-400"}`}
                  aria-hidden="true"
                />
                <span className="flex-1">{t(n.tKey)}</span>
                {alertCount > 0 ? (
                  <span
                    className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-bad text-white text-[11px] font-bold leading-none"
                    title={`${alertCount} need${alertCount === 1 ? "s" : ""} your attention`}
                    aria-label={`${alertCount} alerts`}
                  >
                    {alertCount > 99 ? "99+" : alertCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
          {/* Admin entry — visible to admin AND super_admin. Server-side
              renders/admin routes still re-check the role; this is
              convenience nav only. */}
          {isAdminOrSuper ? (
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition text-brand-purple hover:bg-accent-soft/40 hover:text-white mt-2 border-t border-line pt-3"
            >
              <Shield size={16} strokeWidth={1.5} className="shrink-0" aria-hidden="true" />
              <span className="flex-1">{t("nav.admin")}</span>
              <span className="text-[9px] uppercase tracking-wider opacity-70">{isSuperAdmin ? "super" : "admin"}</span>
            </Link>
          ) : null}
        </nav>
        <ThemeToggle />
        <form action="/logout" method="post" className="px-4 py-3 border-t border-line">
          <button className="btn-ghost w-full" type="submit">{t("common.signOut")}</button>
        </form>
      </aside>
    </>
  );
}
