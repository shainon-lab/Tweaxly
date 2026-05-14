"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

type AlertKey = "transactions" | "insights" | "businessSignals";

const NAV: { href: string; label: string; icon: string; alertKey?: AlertKey }[] = [
  { href: "/dashboard", label: "Executive Summary", icon: "🏠" },
  { href: "/business-signals", label: "Business Signals", icon: "📡", alertKey: "businessSignals" },
  { href: "/consultation", label: "Consultation", icon: "💬" },
  { href: "/forecast", label: "Forecast", icon: "📈" },
  // Reports umbrella now wraps Monthly Reports / Data Flow / Insights —
  // the standalone Insights entry is gone from the sidebar; its sub-tab
  // sits inside this group instead.
  { href: "/report", label: "Reports & Charts", icon: "📑", alertKey: "insights" },
  { href: "/workforce", label: "Workforce Overview", icon: "👥" },
  { href: "/notifications", label: "Set notifications", icon: "🔔" },
  // Single "Data" entry collapses Import data / Transactions / Data log —
  // those three views share an internal DataTabs row. Default landing is
  // /manual-data so the user opens on the same tab the DataTabs nav puts
  // first.
  { href: "/manual-data", label: "Data", icon: "🗂️", alertKey: "transactions" },
  // Integration lives inside Settings → Integration sub-tab now.
  { href: "/settings", label: "Settings", icon: "⚙️" },
  { href: "/account", label: "Account", icon: "👤" },
];

export type SidebarAlerts = { transactions?: number; insights?: number; businessSignals?: number };

export default function Sidebar({
  businessName,
  logoData,
  alerts,
}: { businessName: string; logoData?: string | null; alerts?: SidebarAlerts }) {
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
            // The "Data" entry points at /manual-data but also owns
            // /transactions and /data-log via the DataTabs row. The
            // "Reports and Insights" entry points at /report but also
            // owns /data-flow and /insights via ReportsTabs. Treat each
            // group's siblings as the same selection for the active
            // highlight.
            const dataRoutes = ["/manual-data", "/transactions", "/data-log"];
            const reportsRoutes = ["/report", "/data-flow", "/insights"];
            const inDataGroup = dataRoutes.some((r) => path === r || path.startsWith(r + "/"));
            const inReportsGroup = reportsRoutes.some((r) => path === r || path.startsWith(r + "/"));
            const active =
              n.href === "/manual-data" ? inDataGroup :
              n.href === "/report"      ? inReportsGroup :
              path === n.href || path.startsWith(n.href + "/");
            const alertCount = n.alertKey ? alerts?.[n.alertKey] ?? 0 : 0;
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-slate-300 hover:bg-ink-700 hover:text-slate-100"
                }`}
              >
                <span className="w-4 text-center text-slate-400">{n.icon}</span>
                <span className="flex-1">{n.label}</span>
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
        </nav>
        <ThemeToggle />
        <form action="/logout" method="post" className="px-4 py-3 border-t border-line">
          <button className="btn-ghost w-full" type="submit">Sign out</button>
        </form>
      </aside>
    </>
  );
}
