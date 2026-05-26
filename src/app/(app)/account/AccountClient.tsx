"use client";

// Account page. Top-level destination under the main sidebar nav (sits
// alongside Settings). Sub-tabs:
//   Workspaces | Payment Methods | Password | Language & Region
//   | Communication Preferences | Access Logs | Close Account
//
// The "Workspaces" tab is the cross-workspace overview: one card per
// business with plan + AI credits + alerts + activity. Per-workspace
// billing (purchases, ledger, plan changes) lives inside each
// workspace's own Settings → Business Profile.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { LanguagePreference } from "./LanguagePreference";
import CommunicationPreferences from "./CommunicationPreferences";
import { WorkspaceCard, type WorkspaceCardData } from "../workspaces/WorkspaceCard";
import NotificationsPane from "./NotificationsPane";

type AccountSubTab =
  | "workspaces"
  | "notifications"
  | "payment"
  | "password"
  | "preferences"
  | "communications"
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
    { value: "workspaces",    label: t("account.tab.workspaces") },
    { value: "notifications", label: "Notifications" },
    { value: "payment",       label: "Payment Methods" },
    { value: "password",      label: t("account.tab.password") },
    { value: "preferences",   label: t("account.tab.preferences") },
    { value: "communications", label: "Communication Preferences" },
    { value: "access_logs",   label: t("account.tab.accessLog") },
    { value: "close_account", label: t("account.tab.danger") },
  ];

  return (
    <>
      <div className="mb-6 -mt-2 flex flex-wrap items-center gap-1 rounded-md border border-line bg-ink-900/60 p-1 text-sm">
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

      {tab === "workspaces"    ? <WorkspacesPane workspaces={workspaces} /> : null}
      {tab === "notifications" ? <NotificationsPane workspaces={workspaces} /> : null}
      {tab === "payment"       ? <PaymentMethodsPane /> : null}
      {tab === "password"      ? <PasswordPane user={user} /> : null}
      {tab === "preferences"   ? (
        <LanguagePreference
          initialLocale={user.preferredLanguage}
          initialRegion={user.region}
          detectedRegion={user.detectedRegion}
        />
      ) : null}
      {tab === "communications" ? <CommunicationPreferences /> : null}
      {tab === "access_logs"   ? <AccessLogsPane /> : null}
      {tab === "close_account" ? <CloseAccountPane /> : null}
    </>
  );
}

// Cross-workspace overview grid. Each card shows plan + AI credits +
// alerts + activity; clicking "Manage plan" switches workspace and
// drops the user into that workspace's Settings → Business Profile,
// where the per-workspace billing UI lives.
function WorkspacesPane({ workspaces }: { workspaces: WorkspaceCardData[] }) {
  const totalCredits    = workspaces.reduce((s, c) => s + c.balance, 0);
  const totalAllowance  = workspaces.reduce((s, c) => s + c.monthlyAllowance, 0);
  const totalAlerts     = workspaces.reduce((s, c) => s + c.firingAlerts, 0);
  const readOnlyCount   = workspaces.filter((c) => c.readOnly).length;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Workspaces"         value={workspaces.length.toString()} />
        <Stat label="AI Credits balance" value={totalCredits.toLocaleString()} sub={`of ${totalAllowance.toLocaleString()} monthly`} />
        <Stat label="Firing alerts"      value={totalAlerts.toString()} tone={totalAlerts > 0 ? "warn" : undefined} />
        <Stat label="Read-only"          value={readOnlyCount.toString()} tone={readOnlyCount > 0 ? "bad" : undefined} />
      </div>

      {workspaces.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-sm text-slate-300">You aren&apos;t a member of any workspaces yet.</div>
          <Link
            href="/settings/workspaces"
            className="inline-block mt-4 text-sm px-4 py-1.5 rounded-md border border-accent/40 bg-accent-soft/40 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition"
          >
            Create your first workspace
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((c) => <WorkspaceCard key={c.id} card={c} />)}
        </div>
      )}

      <div className="mt-8 text-xs text-slate-500 flex items-center gap-4 flex-wrap">
        <Link href="/settings/workspaces" className="text-accent hover:underline">
          Manage workspaces (rename / leave / delete) →
        </Link>
        <span className="text-slate-700">·</span>
        <span>Each workspace is billed and metered independently - upgrading one never affects another.</span>
      </div>
    </>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "warn" | "bad" }) {
  const valueCls = tone === "warn" ? "text-warn" : tone === "bad" ? "text-bad" : "text-slate-100";
  return (
    <div className="card-tight">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-1 text-xl font-semibold tabular-nums ${valueCls}`}>{value}</div>
      {sub ? <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div> : null}
    </div>
  );
}

function PaymentMethodsPane() {
  return (
    <div className="card">
      <div className="font-medium mb-1">Payment Methods</div>
      <div className="text-sm text-slate-400 mb-4 leading-relaxed">
        Cards and bank accounts used for any paid Tweaxly products.
      </div>
      <div className="rounded-xl border border-dashed border-line bg-ink-900/30 p-6 text-center">
        <div className="text-sm font-medium text-slate-200 mb-1">No payment methods on file</div>
        <div className="text-xs text-slate-400 max-w-md mx-auto">
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
        <div className="text-xs text-slate-500 mt-2">
          Need to change this? Reach out at support@tweaxly.com - email changes go through a confirmation step.
        </div>
      </div>

      <div className="card mb-4">
        <div className="font-medium mb-1">Password</div>
        <div className="text-sm text-slate-400 mb-3">
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
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
          <div className="font-medium">Two-factor authentication</div>
          <span className="pill text-[10px]">Preview</span>
        </div>
        <div className="text-sm text-slate-400 mb-4 leading-relaxed">
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
          <span className="text-xs text-slate-500">
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
// listed falls back to the raw key with a neutral tone — so newly-added
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
        <div className="text-sm text-slate-500 py-6 text-center">Loading…</div>
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
                  <td className="text-slate-400 text-xs whitespace-nowrap">
                    {new Date(e.createdAt).toLocaleString()}
                  </td>
                  <td className={`text-xs font-medium ${TONE_CLASS[def.tone]}`}>{def.label}</td>
                  <td className="text-slate-300 text-xs max-w-[280px]">
                    <span className="line-clamp-2">{detail ?? "—"}</span>
                  </td>
                  <td className="text-slate-400 text-xs whitespace-nowrap">{e.businessName ?? "—"}</td>
                  <td className="text-slate-500 text-xs font-mono">{e.ipAddress ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="rounded-xl border border-dashed border-line bg-ink-900/30 p-6 text-center">
          <div className="text-sm font-medium text-slate-200 mb-1">No activity recorded yet</div>
          <div className="text-xs text-slate-400 max-w-md mx-auto">
            Sign-ins, uploads, source changes, and billing events will appear here as you use the platform.
          </div>
        </div>
      )}
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
            alert(
              "Account deletion runs through support during preview to prevent accidental data loss. We've recorded your intent - please confirm by emailing support@tweaxly.com from this email address and we'll process it within 24 hours.",
            )
          }
        >
          Permanently close my account
        </button>
        <span className="text-xs text-slate-500">
          Confirmation routes through support during preview.
        </span>
      </div>
    </div>
  );
}
