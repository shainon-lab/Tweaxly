"use client";

// Communication Preferences pane - lives under Account → tab.
//
// Marketing channels are individually opt-in / opt-out. System
// (transactional) email is shown for transparency but is non-editable
// - it's contractually required to operate the account.

import { useEffect, useState } from "react";

interface PrefsState {
  systemEmails: boolean;
  marketingEmails: boolean;
  marketingSMS: boolean;
  productAnnouncements: boolean;
  newsletter: boolean;
  marketingConsentTimestamp: string | null;
  marketingConsentSource: string | null;
  marketingPolicyVersion: string | null;
}

export default function CommunicationPreferences() {
  const [prefs,  setPrefs]  = useState<PrefsState | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/account/communication-preferences");
      if (res.ok) setPrefs(await res.json());
    })();
  }, []);

  async function patch(key: keyof PrefsState, value: boolean) {
    if (!prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/account/communication-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setMsg({ kind: "err", text: body.error ?? `HTTP ${res.status}` });
        // Revert optimistic update on failure.
        setPrefs(prefs);
      } else {
        setMsg({ kind: "ok", text: "Saved." });
      }
    } finally {
      setSaving(false);
    }
  }

  async function unsubscribeAll() {
    if (!confirm("Turn off every marketing channel? You'll continue to receive transactional emails (billing, security, password resets) for as long as your account is active.")) return;
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/account/communication-preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        marketingEmails: false, marketingSMS: false,
        productAnnouncements: false, newsletter: false,
      }),
    });
    setSaving(false);
    if (res.ok && prefs) {
      setPrefs({ ...prefs,
        marketingEmails: false, marketingSMS: false,
        productAnnouncements: false, newsletter: false,
      });
      setMsg({ kind: "ok", text: "All marketing communications turned off." });
    }
  }

  if (!prefs) {
    return <div className="card text-sm text-slate-400">Loading communication preferences…</div>;
  }

  return (
    <>
      <div className="card mb-4">
        <div className="font-medium mb-1">System &amp; transactional email</div>
        <div className="text-sm text-slate-400 mb-3 leading-relaxed">
          Operational notices: billing, security alerts, password
          resets, invoices, and account-related updates. These keep your
          account safe and functional, so they remain on for as long as
          the account is active.
        </div>
        <ChannelRow
          label="Account &amp; system emails"
          description="Required for active accounts."
          checked={prefs.systemEmails}
          locked
          lockedReason="Required for active accounts"
        />
      </div>

      <div className="card mb-4">
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
          <div className="font-medium">Marketing &amp; communications</div>
          <button
            type="button"
            className="text-xs text-slate-400 hover:text-bad transition disabled:opacity-50"
            onClick={() => void unsubscribeAll()}
            disabled={saving || (!prefs.marketingEmails && !prefs.marketingSMS && !prefs.productAnnouncements && !prefs.newsletter)}
          >
            Unsubscribe from all
          </button>
        </div>
        <div className="text-sm text-slate-400 mb-4 leading-relaxed">
          Choose which optional updates you receive. You can change
          these at any time. Your consent timestamp and the privacy
          policy version you consented against are recorded for audit
          purposes.
        </div>

        <ChannelRow
          label="Marketing emails"
          description="Promotional offers, campaigns, and feature marketing."
          checked={prefs.marketingEmails}
          onChange={(v) => void patch("marketingEmails", v)}
        />
        <ChannelRow
          label="Product announcements"
          description="New feature launches and significant product changes."
          checked={prefs.productAnnouncements}
          onChange={(v) => void patch("productAnnouncements", v)}
        />
        <ChannelRow
          label="Newsletter"
          description="Periodic newsletter with finance and operations tips."
          checked={prefs.newsletter}
          onChange={(v) => void patch("newsletter", v)}
        />
        <ChannelRow
          label="Marketing SMS"
          description="Occasional commercial SMS communications."
          checked={prefs.marketingSMS}
          onChange={(v) => void patch("marketingSMS", v)}
        />

        {msg ? (
          <div className={`mt-3 text-xs ${msg.kind === "ok" ? "text-good" : "text-bad"}`}>
            {msg.text}
          </div>
        ) : null}

        {prefs.marketingConsentTimestamp ? (
          <div className="mt-4 pt-4 border-t border-line text-[11px] text-slate-500">
            Last updated{" "}
            {new Date(prefs.marketingConsentTimestamp).toLocaleString()}
            {prefs.marketingConsentSource ? ` · via ${prefs.marketingConsentSource}` : ""}
            {prefs.marketingPolicyVersion ? ` · policy ${prefs.marketingPolicyVersion}` : ""}
          </div>
        ) : null}
      </div>
    </>
  );
}

function ChannelRow({
  label, description, checked, onChange, locked, lockedReason,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  locked?: boolean;
  lockedReason?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-line/60 last:border-b-0">
      <div className="min-w-0">
        <div className="text-sm text-slate-100 font-medium" dangerouslySetInnerHTML={{ __html: label }} />
        <div className="text-xs text-slate-400 mt-0.5 leading-snug">{description}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {locked ? (
          <span className="pill text-[10px]">{lockedReason ?? "Locked"}</span>
        ) : null}
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={locked}
          aria-label={label.replace(/&amp;/g, "&")}
          onClick={() => !locked && onChange?.(!checked)}
          className={`relative w-10 h-6 rounded-full transition ${
            checked ? "bg-brand-purple" : "bg-ink-700"
          } ${locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              checked ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
