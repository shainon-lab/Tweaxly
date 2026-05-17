"use client";

// Language & Region pane. Single field today (interface language);
// future region settings (date format, number format) will land in
// the same card.

import { useState } from "react";
import { LOCALES, LOCALE_LABEL, dirFor, type Locale, isLocale } from "@/lib/i18n";
import { useT } from "@/lib/i18n/client";

export function LanguagePreference({ initialLocale }: { initialLocale: string }) {
  const t = useT();
  const startLocale: Locale = isLocale(initialLocale) ? initialLocale : "en";
  const [locale, setLocale] = useState<Locale>(startLocale);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = locale !== startLocale;

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      if (!res.ok) {
        setError(t("errors.generic"));
        return;
      }
      // Full reload so every server-rendered string (root layout dir,
      // page headers, sidebar) re-renders in the new locale.
      window.location.reload();
    } catch {
      setError(t("errors.network"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card max-w-xl">
      <div className="font-medium mb-1">{t("account.preferences.title")}</div>
      <div className="text-sm text-slate-400 mb-4">{t("account.preferences.intro")}</div>

      <div className="space-y-4">
        <div>
          <label className="label">{t("account.preferences.language")}</label>
          <select
            className="input"
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
          >
            {LOCALES.map((l) => (
              <option key={l} value={l}>
                {LOCALE_LABEL[l]} ({dirFor(l).toUpperCase()})
              </option>
            ))}
          </select>
          <div className="mt-2 text-xs text-slate-500 leading-snug">
            {t("account.preferences.languageHelp")}
          </div>
          <div className="mt-1 text-xs text-slate-500 leading-snug">
            {t("account.preferences.dirAuto")}
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-bad/40 bg-bad/10 text-bad text-sm px-3 py-2">{error}</div>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={!dirty || busy}
            onClick={save}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {busy ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
