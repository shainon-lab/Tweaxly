"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

type AlertKey = "transactions" | "insights" | "businessSignals";

const NAV: { href: string; label: string; icon: string; alertKey?: AlertKey }[] = [
  { href: "/dashboard", label: "Overview", icon: "🏠" },
  { href: "/business-signals", label: "Business Signals", icon: "📡", alertKey: "businessSignals" },
  { href: "/forecast", label: "Forecast", icon: "📈" },
  { href: "/consultation", label: "Consultation", icon: "💬" },
  { href: "/insights", label: "Insights", icon: "💡", alertKey: "insights" },
  { href: "/report", label: "Reports", icon: "📑" },
  { href: "/workforce", label: "Workforce Overview", icon: "👥" },
  { href: "/notifications", label: "Set notifications", icon: "🔔" },
  // Single "Data" entry collapses Import data / Transactions / Data log —
  // those three views share an internal DataTabs row. Default landing is
  // /manual-data so the user opens on the same tab the DataTabs nav puts
  // first.
  { href: "/manual-data", label: "Data", icon: "🗂️", alertKey: "transactions" },
  { href: "/integration", label: "Integration", icon: "🔗" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export type SidebarAlerts = { transactions?: number; insights?: number; businessSignals?: number };

export default function Sidebar({
  businessName,
  logoData,
  alerts,
}: { businessName: string; logoData?: string | null; alerts?: SidebarAlerts }) {
  const path = usePathname();
  const hasCustomLogo = !!logoData;
  return (
    <aside className="w-60 shrink-0 border-r border-line bg-ink-900/70 flex flex-col">
      {/* TWEAXLY is the platform brand and always renders here. The business
          slot below shows either the uploaded business logo or the business
          name as a fallback. */}
      <div className="px-4 py-5 border-b border-line bg-brand-navy">
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
      </div>
      <nav className="px-2 py-3 flex-1 space-y-0.5">
        {NAV.map((n) => {
          // The "Data" entry points at /manual-data but also owns
          // /transactions and /data-log via the DataTabs row. Treat all
          // three as the same selection for the active highlight.
          const dataRoutes = ["/manual-data", "/transactions", "/data-log"];
          const inDataGroup = dataRoutes.some((r) => path === r || path.startsWith(r + "/"));
          const active = n.href === "/manual-data"
            ? inDataGroup
            : path === n.href || path.startsWith(n.href + "/");
          const alertCount = n.alertKey ? alerts?.[n.alertKey] ?? 0 : 0;
          return (
            <Link
              key={n.href}
              href={n.href}
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
                  !
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
  );
}
