"use client";

// Language & Region pane. Language picker drives UI translation +
// document direction. Region is the user's country — auto-filled
// from the IP geolocation header on first visit and overridable
// from the dropdown afterward.

import { useState } from "react";
import { LOCALES, LOCALE_LABEL, dirFor, type Locale, isLocale } from "@/lib/i18n";
import { useT } from "@/lib/i18n/client";
import { REGIONS, isRegionCode, regionName } from "@/lib/regions";

export function LanguagePreference({
  initialLocale,
  initialRegion,
  detectedRegion,
}: {
  initialLocale: string;
  initialRegion: string | null;
  detectedRegion: string | null;
}) {
  const t = useT();
  const startLocale: Locale = isLocale(initialLocale) ? initialLocale : "en";

  // Region precedence: explicit saved value → IP-detected → "" (not set).
  const startRegion = initialRegion ?? detectedRegion ?? "";

  const [locale, setLocale] = useState<Locale>(startLocale);
  const [region, setRegion] = useState<string>(startRegion);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // We treat "auto-detected but never saved" as dirty so the user
  // can hit Save and persist the detected value without having to
  // change the dropdown.
  const localeDirty = locale !== startLocale;
  const regionDirty = region !== (initialRegion ?? "");
  const dirty = localeDirty || regionDirty;

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const body: { locale?: Locale; region?: string | null } = {};
      if (locale !== startLocale) body.locale = locale;
      // Always send region — null clears it, an ISO code sets it.
      body.region = region === "" ? null : region;

      const res = await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(t("errors.generic"));
        return;
      }
      // Full reload so the locale flip (and any region-derived
      // server-rendered defaults) re-render correctly.
      window.location.reload();
    } catch {
      setError(t("errors.network"));
    } finally {
      setBusy(false);
    }
  }

  // Show a small hint when the region is auto-filled but unsaved.
  const showAutoHint = initialRegion == null && region !== "" && detectedRegion;

  return (
    <div className="card max-w-xl">
      <div className="font-medium mb-1">{t("account.preferences.title")}</div>
      <div className="text-sm text-slate-400 mb-4">{t("account.preferences.intro")}</div>

      <div className="space-y-4">
        {/* Language */}
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

        {/* Region */}
        <div>
          <label className="label">Region</label>
          <select
            className="input"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option value="">— Not set —</option>
            {REGIONS.map((r) => (
              <option key={r.code} value={r.code}>{r.name}</option>
            ))}
          </select>
          {showAutoHint ? (
            <div className="mt-2 text-xs text-accent leading-snug">
              Auto-detected from your IP: {regionName(detectedRegion)}. Save to keep it,
              or pick a different region from the list.
            </div>
          ) : (
            <div className="mt-2 text-xs text-slate-500 leading-snug">
              We use this to set sensible defaults — currency suggestions, date format,
              and tax assumptions. Changing it here doesn&apos;t affect existing data.
            </div>
          )}
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
