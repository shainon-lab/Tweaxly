// Admin · Activity. Cross-tenant operational stream merged from
// signups, uploads, consultations, forecasts, alerts, failed logins,
// and admin actions. Filterable by category.

import Link from "next/link";
import { getActivityFeed, categoryLabel, CATEGORY_DOT, type ActivityCategory } from "@/lib/activityFeed";

export const dynamic = "force-dynamic";

const CATEGORIES: { value: ActivityCategory | "all"; label: string; future?: boolean }[] = [
  { value: "all",      label: "All" },
  { value: "signup",   label: "Signups" },
  { value: "data",     label: "Data" },
  { value: "ai",       label: "AI" },
  { value: "forecast", label: "Forecast" },
  { value: "alert",    label: "Alerts" },
  { value: "security", label: "Security" },
  { value: "admin",    label: "Admin" },
  { value: "billing",  label: "Billing", future: true },
  { value: "support",  label: "Support", future: true },
];

function fmtRel(d: Date) {
  const ms = Date.now() - d.getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default async function ActivityFeedPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const cat = (searchParams.category as ActivityCategory | "all" | undefined) ?? "all";
  const items = await getActivityFeed({ category: cat, limit: 150 });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-100">Activity</h1>
        <p className="text-xs text-slate-400 mt-1">
          Operational stream across every workspace. Newest first.
        </p>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap sticky top-12 z-10 bg-ink-950/90 backdrop-blur py-2 -my-2 border-y border-line/40">
        {CATEGORIES.map((c) => {
          const active = (cat ?? "all") === c.value;
          const href = c.value === "all" ? "/admin/activity" : `/admin/activity?category=${c.value}`;
          return (
            <Link
              key={c.value}
              href={href}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                active
                  ? "bg-accent-soft border-accent/40 text-accent"
                  : "border-line text-slate-400 hover:text-slate-200 hover:border-slate-500"
              } ${c.future ? "opacity-50" : ""}`}
              title={c.future ? "Reserved — no backing system yet" : undefined}
            >
              {c.label}
              {c.future ? " · soon" : null}
            </Link>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-line bg-ink-900/40 p-8 text-center text-sm text-slate-500">
          Nothing in this stream yet.
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-ink-900/40 overflow-hidden">
          <ul className="divide-y divide-line/60">
            {items.map((i) => (
              <li key={i.id} className="px-4 py-2.5 flex items-start gap-3 hover:bg-ink-800/40 transition">
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${CATEGORY_DOT[i.category]} shrink-0`} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">
                    <span>{categoryLabel(i.category)}</span>
                    {i.business ? (
                      <>
                        <span className="text-slate-700">·</span>
                        <Link href={`/admin/accounts/${i.business.id}`} className="text-slate-400 hover:text-accent normal-case tracking-normal">
                          {i.business.name}
                        </Link>
                      </>
                    ) : null}
                    {i.actorEmail ? (
                      <>
                        <span className="text-slate-700">·</span>
                        <span className="text-slate-400 normal-case tracking-normal">{i.actorEmail}</span>
                      </>
                    ) : null}
                  </div>
                  <div className="text-sm text-slate-200 leading-snug">{i.title}</div>
                  {i.detail ? <div className="text-xs text-slate-500 leading-snug truncate">{i.detail}</div> : null}
                </div>
                <div className="text-[11px] text-slate-500 tabular-nums shrink-0 mt-1">{fmtRel(i.at)}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
