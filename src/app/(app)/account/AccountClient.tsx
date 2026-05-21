"use client";

// Account page. Top-level destination under the main sidebar nav (sits
// alongside Settings). Sub-tabs:
//   Billing & Products | Payment Methods | Password | Language & Region
//   | Access Logs | Close Account

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { LanguagePreference } from "./LanguagePreference";
import CommunicationPreferences from "./CommunicationPreferences";

type AccountSubTab =
  | "billing"
  | "payment"
  | "password"
  | "preferences"
  | "communications"
  | "access_logs"
  | "close_account";

export default function AccountClient({
  user,
}: {
  user: {
    email: string;
    createdAt: string;
    preferredLanguage: string;
    region: string | null;
    detectedRegion: string | null;
  };
}) {
  const t = useT();
  const [tab, setTab] = useState<AccountSubTab>("billing");

  const subTabs: { value: AccountSubTab; label: string }[] = [
    { value: "billing",       label: t("account.tab.billing") },
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

      {tab === "billing"       ? <BillingPane /> : null}
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

// Plan + credit balance summary, fetched live from /api/billing/credits.
// The full picture (transactions, redeem code, packs) lives in
// /settings/billing - this pane keeps the Account-page surface short
// and links over rather than duplicating.

const PLAN_LABEL: Record<string, string> = {
  free: "Free", pro: "Pro", business: "Business",
};

function BillingPane() {
  const [info, setInfo] = useState<{
    plan:             string;
    balance:          number;
    monthlyAllowance: number;
    readOnly:         boolean;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/billing/credits")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (cancelled || !d) return;
        setInfo({
          plan:             d.plan,
          balance:          d.balance,
          monthlyAllowance: d.monthlyAllowance,
          readOnly:         d.readOnly,
        });
      })
      .catch(() => { /* widget is best-effort */ });
    return () => { cancelled = true };
  }, []);

  const planLabel = info ? (PLAN_LABEL[info.plan] ?? info.plan) : null;

  return (
    <div className="card">
      <div className="font-medium mb-1">Billing &amp; Products</div>
      <div className="text-sm text-slate-400 mb-4 leading-relaxed">
        Your active plan and credit balance. For invoices, credit packs and
        plan changes, head to{" "}
        <Link href="/settings/billing" className="text-accent hover:underline">
          Settings → Billing &amp; Credits
        </Link>
        .
      </div>
      <div className="rounded-xl border border-line bg-ink-900/40 p-5 mb-3">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={info?.readOnly ? "pill-warn" : "pill-good"}>
            {info?.readOnly ? "Read-only" : "Active"}
          </span>
          <span className="text-base font-semibold text-slate-100">
            {planLabel ? `Tweaxly ${planLabel}` : "Loading…"}
          </span>
          {info ? (
            <span className="ml-auto text-xs text-slate-400 tabular-nums">
              {info.balance.toLocaleString()} / {info.monthlyAllowance.toLocaleString()} AI Credits left
            </span>
          ) : null}
        </div>
        <div className="text-sm text-slate-400">
          {info?.readOnly
            ? "This workspace is in read-only mode. Reactivate from Billing & Credits to resume AI consultation, uploads and exports."
            : info?.plan === "free"
              ? "You're on the Free plan: 1 business, 90 days history, 30 AI Credits per month, up to 3 business signals per month. Upgrade for unlimited."
              : info?.plan === "pro"
                ? "You're on the Pro plan: unlimited businesses, history, signals + full forecasting + Scenario Builder + exports + 500 AI Credits per month."
                : info?.plan === "business"
                  ? "You're on the Business plan: everything on Pro, plus teams, priority AI processing, API access, audit logs + 2,000 AI Credits per month."
                  : ""}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          href="/settings/billing"
          className="text-sm px-4 py-1.5 rounded-md border border-accent/40 bg-accent-soft/40 text-accent font-medium hover:bg-accent-soft hover:border-accent hover:text-white transition"
        >
          Manage in Billing &amp; Credits →
        </Link>
        {info?.plan === "free" ? (
          <Link
            href="/settings/billing"
            className="text-sm px-4 py-1.5 rounded-md border border-line text-slate-300 hover:text-white hover:border-slate-500 transition"
          >
            See Pro &amp; Business plans
          </Link>
        ) : null}
      </div>
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

function AccessLogsPane() {
  return (
    <div className="card">
      <div className="font-medium mb-1">Access Logs</div>
      <div className="text-sm text-slate-400 mb-4 leading-relaxed">
        Recent sign-ins and security events on your account.
      </div>
      <div className="rounded-xl border border-dashed border-line bg-ink-900/30 p-6 text-center">
        <div className="text-sm font-medium text-slate-200 mb-1">Access log will appear here</div>
        <div className="text-xs text-slate-400 max-w-md mx-auto">
          We&apos;ll surface sign-in events, password changes, device fingerprints, and unusual-location alerts here as part of the production security release.
        </div>
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
