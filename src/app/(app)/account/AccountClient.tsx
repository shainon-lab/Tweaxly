"use client";

// Account page. Top-level destination under the main sidebar nav (sits
// alongside Settings). Sub-tabs:
//   Workspaces | Orders & Invoices | Password | Language & Region
//   | Communication & Notifications | Accessibility | Access Logs
//   | Close Account
//
// The "Workspaces" tab is the cross-workspace overview: one card per
// business with plan + AI credits + alerts + activity. Per-workspace
// billing (purchases, ledger, plan changes) lives inside each
// workspace's own Settings → Business Profile.
//
// Payment Methods sits as a section INSIDE Orders & Invoices rather
// than as its own tab - the two surfaces answer the same "how you pay
// / what you paid" question and were splitting cognitive load for no
// real gain.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { LanguagePreference } from "./LanguagePreference";
import CommunicationPreferences from "./CommunicationPreferences";
import { WorkspaceCard, type WorkspaceCardData } from "../workspaces/WorkspaceCard";
import NotificationsPane from "./NotificationsPane";
import OrdersInvoicesSection from "@/components/billing/OrdersInvoicesSection";
import LoadingBar from "@/components/LoadingBar";
import PageHeader from "@/components/PageHeader";
import AccountHelp from "@/components/AccountHelp";
import SharedAnalysesPane from "./SharedAnalysesPane";
import { Plus } from "lucide-react";
import {
  readA11yWidgetEnabled,
  setA11yWidgetEnabled,
  onA11yWidgetToggle,
} from "@/lib/a11y/visibilityStore";
import { notify } from "@/lib/notify";

type AccountSubTab =
  | "workspaces"
  | "orders"
  | "shared_analyses"
  | "password"
  | "preferences"
  | "comm_notifications"
  | "accessibility"
  | "access_logs"
  | "close_account";

export default function AccountClient({
  user,
  workspaces,
}: {
  user: {
    email: string;
    createdAt: string;
    preferredLanguage: string;
    region: string | null;
    detectedRegion: string | null;
  };
  workspaces: WorkspaceCardData[];
}) {
  const t = useT();
  const [tab, setTab] = useState<AccountSubTab>("workspaces");

  const subTabs: { value: AccountSubTab; label: string }[] = [
    { value: "workspaces",         label: t("account.tab.workspaces") },
    // Orders & Invoices sit right after Workspaces because they're
    // tied to the paying user (this account), not to who has access
    // to each workspace. Payment Methods used to be its own tab but
    // now renders as a section inside the Orders & Invoices view -
    // the two are conceptually one "how you pay / what you paid" tab.
    { value: "orders",             label: "Orders & Invoices" },
    // Shared Analyses sits right after Orders because both surfaces
    // are "things you've produced from this account" — orders are
    // your purchase history, shares are your outbound links.
    // Workspace-scoped: the list reflects the currently active
    // workspace, same as the create API.
    { value: "shared_analyses",    label: "Shared Insights" },
    { value: "password",           label: t("account.tab.password") },
    { value: "preferences",        label: t("account.tab.preferences") },
    // Merged from the previous separate "Notifications" and
    // "Communication Preferences" tabs - the two surfaces are tightly
    // related ("how do we contact you?") and live behind one tab with
    // internal sub-tabs.
    { value: "comm_notifications", label: "Communication & Notifications" },
    { value: "accessibility",      label: "Accessibility" },
    { value: "access_logs",        label: t("account.tab.accessLog") },
    { value: "close_account",      label: t("account.tab.danger") },
  ];

  const subTabTitle = subTabs.find((s) => s.value === tab)?.label ?? "Workspaces";

  return (
    <>
      <PageHeader
        title={`Account - ${subTabTitle}`}
        subtitle={t("account.subtitle")}
        help={<AccountHelp />}
      />
      {/* Sticky just under the PageHeader (~85px). Solid bg + border
          so the sub-tabs stay readable while scrolling and don't get
          cut by the sticky title. Same pattern as DataTabs and
          BusinessSettingsTabs. */}
      <div className="sticky top-[85px] z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-ink-950 pt-2 pb-3 border-b border-line/40 mb-6">
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-line bg-ink-900/60 p-1 text-sm">
          {subTabs.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`px-3 py-1.5 rounded transition ${
                tab === t.value
                  ? "bg-accent-soft text-accent"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "workspaces"        ? <WorkspacesPane workspaces={workspaces} /> : null}
      {tab === "orders"            ? (
        <div className="space-y-6">
          <OrdersInvoicesSection />
          <PaymentMethodsPane />
        </div>
      ) : null}
      {tab === "shared_analyses"   ? <SharedAnalysesPane /> : null}
      {tab === "password"          ? <PasswordPane user={user} /> : null}
      {tab === "preferences"       ? (
        <LanguagePreference
          initialLocale={user.preferredLanguage}
          initialRegion={user.region}
          detectedRegion={user.detectedRegion}
        />
      ) : null}
      {tab === "comm_notifications" ? <CommNotificationsPane workspaces={workspaces} /> : null}
      {tab === "accessibility"     ? <AccessibilityPane /> : null}
      {tab === "access_logs"       ? <AccessLogsPane /> : null}
      {tab === "close_account"     ? <CloseAccountPane /> : null}
    </>
  );
}

// Cross-workspace overview grid. Each card shows plan + AI credits +
// alerts + activity, plus inline management actions (rename / leave /
// delete). The "Create workspace" button at the top of the pane opens
// the same dialog that used to live under /settings/workspaces.
function WorkspacesPane({ workspaces }: { workspaces: WorkspaceCardData[] }) {
  const totalCredits    = workspaces.reduce((s, c) => s + c.balance, 0);
  const totalAllowance  = workspaces.reduce((s, c) => s + c.monthlyAllowance, 0);
  const totalAlerts     = workspaces.reduce((s, c) => s + c.firingAlerts, 0);
  const readOnlyCount   = workspaces.filter((c) => c.readOnly).length;
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Workspaces"         value={workspaces.length.toString()} />
        <Stat label="AI Credits balance" value={totalCredits.toLocaleString()} sub={`of ${totalAllowance.toLocaleString()} monthly`} />
        <Stat label="Firing alerts"      value={totalAlerts.toString()} tone={totalAlerts > 0 ? "warn" : undefined} />
        <Stat label="Read-only"          value={readOnlyCount.toString()} tone={readOnlyCount > 0 ? "bad" : undefined} />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="text-sm text-slate-400">
          {workspaces.length} workspace{workspaces.length === 1 ? "" : "s"} under your account.
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="text-sm px-4 py-1.5 rounded-md border border-accent/40 bg-accent-soft/40 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition inline-flex items-center gap-1.5"
        >
          <Plus size={14} strokeWidth={2} /> Create new workspace
        </button>
      </div>

      {workspaces.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-sm text-slate-300">You aren&apos;t a member of any workspaces yet.</div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-block mt-4 text-sm px-4 py-1.5 rounded-md border border-accent/40 bg-accent-soft/40 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition"
          >
            Create your first workspace
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((c) => <WorkspaceCard key={c.id} card={c} />)}
        </div>
      )}

      <div className="mt-8 t-body text-slate-500">
        Each workspace is billed and metered independently - upgrading one never affects another.
      </div>

      {createOpen ? <CreateWorkspaceDialog onClose={() => setCreateOpen(false)} /> : null}
    </>
  );
}

function CreateWorkspaceDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/businesses/create", {
        method:  "POST",
        headers: { "content-type": "application/json" },
        body:    JSON.stringify({ name, industry: industry || undefined, country: country || undefined }),
      });
      if (!res.ok) {
        const t = await res.text();
        let msg = `Create failed (${res.status})`;
        try {
          const data = JSON.parse(t);
          // 402 = workspace cap reached. The API ships a friendly
          // `message` explaining which tier to upgrade to; prefer
          // that over the raw `error` code.
          msg = data.message ?? data.error ?? msg;
        } catch { /* keep */ }
        setError(msg);
        return;
      }
      window.location.assign("/dashboard");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="card w-full max-w-md">
        <div className="mb-4">
          <div className="text-lg font-semibold text-slate-100">New workspace</div>
          <div className="text-sm text-slate-400 mt-1">
            Belongs to your account. No new login required.
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Business name *</label>
            <input autoFocus className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Side Co." />
          </div>
          <div>
            <label className="label">Business type <span className="text-slate-500">(optional)</span></label>
            <input className="input" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. SaaS, Retail, Agency" />
          </div>
          <div>
            <label className="label">Country <span className="text-slate-500">(optional)</span></label>
            <input className="input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. United States" />
          </div>
          {error ? <div className="text-sm text-bad">{error}</div> : null}
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancel</button>
          <button type="button" disabled={!name.trim() || busy} onClick={() => void submit()} className="btn-primary text-sm disabled:opacity-50">
            {busy ? "Creating…" : "Create workspace"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "warn" | "bad" }) {
  const valueCls = tone === "warn" ? "text-warn" : tone === "bad" ? "text-bad" : "text-slate-100";
  return (
    <div className="card-tight">
      <div className="t-meta uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-1.5 text-xl font-semibold tabular-nums ${valueCls}`}>{value}</div>
      {sub ? <div className="t-meta text-slate-500 mt-1">{sub}</div> : null}
    </div>
  );
}

// Combined Communication & Notifications pane. Hosts the two existing
// surfaces (CommunicationPreferences + NotificationsPane) behind an
// inner tab strip so the user gets one entry point instead of two
// separate top-level tabs for closely related settings.
function CommNotificationsPane({ workspaces }: { workspaces: WorkspaceCardData[] }) {
  const [inner, setInner] = useState<"communication" | "notifications">("communication");
  return (
    <>
      {/* Secondary-level sticky strip - sits below the primary
          Account sub-tabs (which sticks at top-[85px] and is ~55px
          tall). 85 + 55 = ~140px. */}
      <div className="sticky top-[140px] z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-ink-950 pt-2 pb-3 border-b border-line/40 mb-4">
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-line bg-ink-900/60 p-1 text-sm">
          <button
            type="button"
            onClick={() => setInner("communication")}
            className={`px-3 py-1.5 rounded transition ${
              inner === "communication"
                ? "bg-accent-soft text-accent"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Communication Preferences
          </button>
          <button
            type="button"
            onClick={() => setInner("notifications")}
            className={`px-3 py-1.5 rounded transition ${
              inner === "notifications"
                ? "bg-accent-soft text-accent"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Notifications
          </button>
        </div>
      </div>
      {inner === "communication" ? <CommunicationPreferences /> : <NotificationsPane workspaces={workspaces} />}
    </>
  );
}

function PaymentMethodsPane() {
  return (
    <div className="card">
      <div className="font-medium mb-1">Payment Methods</div>
      <div className="t-body text-slate-400 mb-4">
        Cards and bank accounts used for any paid Tweaxly products.
      </div>
      <div className="rounded-xl border border-dashed border-line bg-ink-900/30 p-6 text-center">
        <div className="t-card text-slate-200 mb-2">No payment methods on file</div>
        <div className="t-body text-slate-400 max-w-md mx-auto">
          You don&apos;t need one yet - Tweaxly is free during preview. Once paid plans go live, you&apos;ll be able to add a card here.
        </div>
      </div>
    </div>
  );
}

function PasswordPane({ user }: { user: { email: string; createdAt: string } }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmNext, setConfirmNext] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  async function save() {
    setMsg(null);
    if (!current) {
      setMsg({ kind: "err", text: "Enter your current password." });
      return;
    }
    if (next.length < 6) {
      setMsg({ kind: "err", text: "New password must be at least 6 characters." });
      return;
    }
    if (next !== confirmNext) {
      setMsg({ kind: "err", text: "New passwords don't match." });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setMsg({ kind: "err", text: body.error ?? `HTTP ${res.status}` });
        return;
      }
      setCurrent(""); setNext(""); setConfirmNext("");
      setMsg({ kind: "ok", text: "Password updated." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="card mb-4">
        <div className="font-medium mb-1">Login email</div>
        <div className="text-sm text-slate-400 mb-3">
          The address you use to sign in.
        </div>
        <input
          className="input bg-ink-900/60"
          value={user.email}
          readOnly
          aria-readonly="true"
        />
        <div className="t-body text-slate-500 mt-3">
          Need to change this? Reach out at support@tweaxly.com - email changes go through a confirmation step.
        </div>
      </div>

      <div className="card mb-4">
        <div className="t-card mb-2">Password</div>
        <div className="t-body text-slate-400 mb-4">
          Enter your current password, then choose a new one. Minimum 6 characters.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="label">Current password</label>
            <input
              type="password"
              className="input"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="label">New password</label>
            <input
              type="password"
              className="input"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input
              type="password"
              className="input"
              value={confirmNext}
              onChange={(e) => setConfirmNext(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            className="btn-primary"
            onClick={() => void save()}
            disabled={saving}
          >
            {saving ? "Updating…" : "Update password"}
          </button>
          {msg ? (
            <span className={msg.kind === "ok" ? "text-good text-sm" : "text-bad text-sm"}>
              {msg.text}
            </span>
          ) : null}
        </div>
      </div>

      <div className="card">
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
          <div className="t-card">Two-factor authentication</div>
          <span className="pill">Preview</span>
        </div>
        <div className="t-body text-slate-400 mb-4">
          Add a second verification step at sign-in using an authenticator app like 1Password, Authy, or Google Authenticator.
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            className={twoFAEnabled ? "btn-ghost" : "btn-primary"}
            onClick={() => setTwoFAEnabled((v) => !v)}
          >
            {twoFAEnabled ? "Disable 2FA" : "Enable 2FA"}
          </button>
          <span className="t-meta text-slate-500">
            {twoFAEnabled
              ? "Preview only - enforcement at sign-in lands with the production billing release."
              : "Not enabled."}
          </span>
        </div>
      </div>
    </>
  );
}

type AccessLogEntry = {
  id:        string;
  action:    string;
  createdAt: string;
  metadata:  Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  businessId:   string | null;
  businessName: string | null;
};

// Human-readable label + tone per audit/login action key. Anything not
// listed falls back to the raw key with a neutral tone - so newly-added
// action types still appear on the feed without code changes.
const ACTION_LABELS: Record<string, { label: string; tone: "good" | "warn" | "bad" | "neutral" }> = {
  "auth.login":                     { label: "Signed in",            tone: "good" },
  "auth.login_failed":              { label: "Failed sign-in",       tone: "bad" },
  "auth.logout":                    { label: "Signed out",           tone: "neutral" },
  "data.upload":                    { label: "Uploaded data",        tone: "good" },
  "source.created":                 { label: "Created source",       tone: "good" },
  "billing.subscription_created":   { label: "Subscription started", tone: "good" },
  "billing.subscription_updated":   { label: "Subscription updated", tone: "neutral" },
  "billing.subscription_canceled":  { label: "Subscription canceled", tone: "warn" },
  "account.status_change":          { label: "Account status changed", tone: "warn" },
  "impersonation.enter":            { label: "Support session started", tone: "warn" },
  "impersonation.exit":             { label: "Support session ended",   tone: "neutral" },
};

const TONE_CLASS: Record<"good" | "warn" | "bad" | "neutral", string> = {
  good:    "text-good",
  warn:    "text-warn",
  bad:     "text-bad",
  neutral: "text-slate-300",
};

function describeEntry(e: AccessLogEntry): string | null {
  const m = e.metadata ?? {};
  switch (e.action) {
    case "data.upload": {
      const filename = typeof m.filename === "string" ? m.filename : null;
      const imported = typeof m.imported === "number" ? m.imported : null;
      if (filename && imported != null) return `${filename} · ${imported} row${imported === 1 ? "" : "s"}`;
      if (filename) return filename;
      return null;
    }
    case "source.created": {
      const name = typeof m.name === "string" ? m.name : null;
      const type = typeof m.type === "string" ? m.type : null;
      return [name, type].filter(Boolean).join(" · ") || null;
    }
    case "billing.subscription_created":
    case "billing.subscription_updated":
    case "billing.subscription_canceled": {
      const plan = typeof m.plan === "string" ? m.plan : null;
      return plan ? `Plan: ${plan}` : null;
    }
    case "auth.login":
    case "auth.login_failed": {
      const email = typeof m.email === "string" ? m.email : null;
      return email;
    }
    default:
      return null;
  }
}

function AccessLogsPane() {
  const [entries, setEntries] = useState<AccessLogEntry[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/account/access-logs");
        const d = await r.json();
        if (!cancelled) setEntries(d.entries ?? []);
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true };
  }, []);

  return (
    <div className="card">
      <div className="font-medium mb-1">Access Logs</div>
      <div className="text-sm text-slate-400 mb-4 leading-relaxed">
        Recent sign-ins, sign-outs, uploads, source changes, and billing events across your workspaces.
      </div>
      {loading ? (
        <div className="py-2"><LoadingBar label="Loading activity…" /></div>
      ) : entries && entries.length > 0 ? (
        <table className="table-base">
          <thead>
            <tr>
              <th>When</th>
              <th>Event</th>
              <th>Detail</th>
              <th>Workspace</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const def = ACTION_LABELS[e.action] ?? { label: e.action, tone: "neutral" as const };
              const detail = describeEntry(e);
              return (
                <tr key={e.id}>
                  <td className="text-slate-400 t-meta whitespace-nowrap">
                    {new Date(e.createdAt).toLocaleString()}
                  </td>
                  <td className={`t-meta font-semibold ${TONE_CLASS[def.tone]}`}>{def.label}</td>
                  <td className="text-slate-300 t-body max-w-[280px]">
                    <span className="line-clamp-2">{detail ?? " - "}</span>
                  </td>
                  <td className="text-slate-400 t-meta whitespace-nowrap">{e.businessName ?? " - "}</td>
                  <td className="text-slate-500 t-meta font-mono">{e.ipAddress ?? " - "}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="rounded-xl border border-dashed border-line bg-ink-900/30 p-6 text-center">
          <div className="t-card text-slate-200 mb-2">No activity recorded yet</div>
          <div className="t-body text-slate-400 max-w-md mx-auto">
            Sign-ins, uploads, source changes, and billing events will appear here as you use the platform.
          </div>
        </div>
      )}
    </div>
  );
}

// Accessibility pane. Today: a single toggle for the accessibility
// widget that shows the floating tools menu inside the app. Designed
// future-ready so native a11y controls (high-contrast / larger text /
// reduced motion / etc.) can slot in alongside without restructuring
// the tab. Persistence is browser-local for now via the visibility
// store; a future enhancement can sync to a server-side user
// preference column.
function AccessibilityPane() {
  const [enabled, setEnabled] = useState(false);
  // Hydrate on mount to avoid the server/client mismatch around
  // localStorage. The store fires a custom event on every change so
  // we re-read here when other surfaces (sidebar) flip it too.
  useEffect(() => {
    setEnabled(readA11yWidgetEnabled());
    return onA11yWidgetToggle(({ enabled }) => setEnabled(enabled));
  }, []);

  // The accessibility settings page must itself be accessible to the
  // exact users it's designed for. Every text element on this pane
  // uses a 19px minimum body size with proportionally larger headings
  // and section titles. Reading line-height is bumped to 1.6 for
  // comfort at the larger size.
  return (
    <div className="space-y-4 text-[19px] leading-[1.6]">
      <div className="card">
        <h2 className="text-3xl font-semibold text-slate-100 mb-2">Accessibility</h2>
        <p className="text-slate-300 mb-6">
          Tweaxly stays accessible by default — semantic HTML, keyboard
          navigation, visible focus states, and proper labels are
          maintained whether or not the widget below is on. The
          accessibility widget is an optional enhancement layer that
          exposes additional reading and interaction tools when you
          need them.
        </p>

        <div className="flex items-start justify-between gap-5 py-5 border-t border-line">
          <div className="min-w-0 flex-1">
            <div className="text-[22px] font-semibold text-slate-100 leading-snug">
              Show accessibility widget in the interface
            </div>
            <div className="text-slate-300 mt-2">
              Enable the accessibility tools menu inside the application
              interface. When on, an &quot;Accessibility Widget&quot; item
              appears in the sidebar, below the theme toggle. Click it
              to open the panel and adjust contrast, font size, reading
              tools, and more.
            </div>
          </div>
          {/* Larger touch target than the standard sidebar toggle - this
              control specifically serves users who need bigger hit
              areas, so it's roughly 50% larger than the platform's
              default switch. */}
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setA11yWidgetEnabled(!enabled)}
            className={`shrink-0 relative inline-flex h-9 w-16 items-center rounded-full transition-colors ${
              enabled ? "bg-accent" : "bg-ink-700 border border-line"
            }`}
            aria-label="Show accessibility widget in the interface"
          >
            <span
              aria-hidden="true"
              className={`inline-block h-7 w-7 transform rounded-full bg-white shadow transition-transform ${
                enabled ? "translate-x-8" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Future-ready section. Native accessibility controls will land
          here as separate toggles independent of the widget itself —
          per the spec: high contrast, larger text, reduced motion,
          readable font, focus highlight, comfortable spacing. Keep
          the section visible (even with placeholder copy) so users
          discover it's coming. */}
      <div className="card">
        <h3 className="text-3xl font-semibold text-slate-100 mb-2">Native accessibility controls</h3>
        <p className="text-slate-300 mb-4">
          Coming soon — adjust these directly without enabling the widget:
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-slate-200">
          {[
            "High contrast mode",
            "Larger text",
            "Reduced motion",
            "Readable font",
            "Focus highlight",
            "Comfortable spacing",
          ].map((label) => (
            <li key={label} className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-accent shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CloseAccountPane() {
  const [confirm, setConfirm] = useState("");
  return (
    <div className="card border-bad/40 bg-bad/5">
      <div className="font-medium text-bad mb-1">Close your account</div>
      <div className="text-sm text-slate-300 mb-4 leading-relaxed">
        Closing your account permanently deletes your business, transactions, employees, manual entries, uploads,
        notifications, consultations, and any other data tied to it. This cannot be undone.
      </div>
      <div className="mb-3">
        <label className="label">Type <span className="font-mono text-bad">DELETE</span> to confirm</label>
        <input
          className="input max-w-sm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="DELETE"
        />
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          className="btn-danger disabled:opacity-50"
          disabled={confirm !== "DELETE"}
          onClick={() =>
            notify.alert(
              "Account deletion runs through support during preview to prevent accidental data loss. We've recorded your intent - please confirm by emailing support@tweaxly.com from this email address and we'll process it within 24 hours.",
            )
          }
        >
          Permanently close my account
        </button>
        <span className="t-meta text-slate-500">
          Confirmation routes through support during preview.
        </span>
      </div>
    </div>
  );
}
