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
  Database,
  Shield,
  type LucideIcon,
} from "lucide-react";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import BusinessSwitcher, { type SwitcherWorkspace } from "./BusinessSwitcher";
import UsageModal from "./billing/UsageModal";
import BellButton from "./notifications/BellButton";
import { useT } from "@/lib/i18n/client";

type AlertKey = "transactions" | "insights" | "businessSignals";

// Sidebar nav is intentionally calm - thin outline icons (lucide), no
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
  // Workforce Planning lives inside Forecast as a sub-tab now - the
  // platform is business-intelligence, not HR, so workforce is a
  // financial-planning lever rather than a standalone destination.
  // Data section owns the operational data surfaces: Sources, Import
  // Data, Integration, Transactions, Data Log. Settings is now
  // configuration-only (Business Settings / Profile / Plan / Categories).
  // The transactions alert badge moved with Transactions to /data.
  { href: "/data",             tKey: "nav.data",     Icon: Database,          alertKey: "transactions" },
  { href: "/settings",         tKey: "nav.settings", Icon: SlidersHorizontal },
  { href: "/account",          tKey: "nav.account",  Icon: CircleUser },
];

export type SidebarAlerts = { transactions?: number; insights?: number; businessSignals?: number };

export interface SidebarBilling {
  plan:             string;   // "free" | "pro" | "business"
  balance:          number;
  monthlyAllowance: number;
}

export default function Sidebar({
  businessName,
  businessId,
  logoData,
  alerts,
  systemRole,
  workspaces,
  billing,
}: {
  businessName: string;
  businessId?: string;
  logoData?: string | null;
  alerts?: SidebarAlerts;
  systemRole?: string;
  workspaces?: SwitcherWorkspace[];
  billing?: SidebarBilling;
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
      {/* Mobile hamburger toggle - sits in the top-left corner over the
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

      {/* Backdrop - shows on mobile when the drawer is open. Click to close. */}
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
        <div
          data-sidebar-header
          className="px-4 py-5 border-b border-line bg-brand-navy relative"
        >
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
          {/* Workspace switcher - replaces the static business-name label.
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
          {/* Credit balance pill - subtle, link to billing settings.
              Hidden when billing data isn't loaded (e.g. during the
              very first render before ensureMonthlyAllowance has run). */}
          {billing ? <SidebarCreditsPill billing={billing} /> : null}
          {/* Top-right corner: notifications bell + mobile close. The
              bell triggers the Notification Center side panel; the
              close button is mobile-only. */}
          <div className="absolute top-3 right-3 flex items-center gap-1">
            <BellButton />
            <button
              type="button"
              className="lg:hidden w-8 h-8 inline-flex items-center justify-center text-slate-300 hover:text-white rounded-md"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <span className="text-lg leading-none">✕</span>
            </button>
          </div>
        </div>
        <nav className="px-2 py-3 flex-1 space-y-0.5 overflow-y-auto">
          {NAV.map((n) => {
            // Settings now owns ONLY configuration surfaces (/settings
            // and its tab variants). Data section owns the operational
            // surfaces: Sources, Import (manual-data), Integration,
            // Transactions, Data Log. Reports & Charts owns /report,
            // /data-flow, /insights via ReportsTabs.
            const settingsRoutes = ["/settings"];
            const dataRoutes     = ["/data", "/sources", "/manual-data", "/transactions", "/data-log", "/integration"];
            const reportsRoutes  = ["/report", "/data-flow", "/insights"];
            // Forecast owns /forecast plus /workforce (Workforce
            // Planning sub-tab) plus /employees (Edit Roster drill-
            // down kept inside the Forecast nav group).
            const forecastRoutes = ["/forecast", "/workforce", "/employees"];
            const inSettingsGroup = settingsRoutes.some((r) => path === r || path.startsWith(r + "/"));
            const inDataGroup     = dataRoutes.some((r) => path === r || path.startsWith(r + "/"));
            const inReportsGroup  = reportsRoutes.some((r) => path === r || path.startsWith(r + "/"));
            const inForecastGroup = forecastRoutes.some((r) => path === r || path.startsWith(r + "/"));
            const active =
              n.href === "/settings" ? inSettingsGroup :
              n.href === "/data"     ? inDataGroup :
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
          {/* Admin entry - visible to admin AND super_admin. Server-side
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

// Small credit-balance pill that sits below the workspace switcher.
// Click opens the UsageModal (current plan + side-by-side comparison
// with the next tier + Upgrade CTA). The pill itself is purely
// presentational; all upgrade plumbing lives in the modal.
function SidebarCreditsPill({ billing }: { billing: SidebarBilling }) {
  const { balance, monthlyAllowance, plan } = billing;
  const [usageOpen, setUsageOpen] = useState(false);
  const low   = balance > 0 && balance < 5;
  const empty = balance <= 0;
  const pct   = monthlyAllowance > 0
    ? Math.max(0, Math.min(100, Math.round((balance / monthlyAllowance) * 100)))
    : 0;
  const planLabel = plan === "pro" || plan === "business" ? "Pro" : "Free";

  return (
    <>
      <button
        type="button"
        onClick={() => setUsageOpen(true)}
        aria-haspopup="dialog"
        data-credits-pill
        className="mt-3 w-full block text-left rounded-md border border-line/60 bg-ink-900/40 hover:border-accent/40 hover:bg-ink-900 transition px-3 py-2 cursor-pointer"
      >
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
          <span>{planLabel} · AI Credits</span>
          <span className={empty ? "text-bad" : low ? "text-warn" : "text-slate-300"}>
            {balance.toLocaleString()}
          </span>
        </div>
        <div className="mt-1.5 h-1 rounded-full bg-ink-700/80 overflow-hidden">
          <div
            className={`h-full rounded-full ${
              empty ? "bg-bad" : low ? "bg-warn" : "bg-gradient-to-r from-brand-purple to-brand-teal"
            }`}
            style={{ width: `${pct}%` }}
            aria-hidden="true"
          />
        </div>
      </button>
      <UsageModal
        open={usageOpen}
        onClose={() => setUsageOpen(false)}
        plan={plan}
        balance={balance}
        monthlyAllowance={monthlyAllowance}
      />
    </>
  );
}
