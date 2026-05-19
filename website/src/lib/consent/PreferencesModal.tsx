"use client";

// Full preferences modal. Accessible dialog with one toggle per
// optional category (necessary is shown but locked on). The user can
// either Save (custom), Accept All, or Reject Non-Essential.

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useConsent } from "./provider";
import { defaultDeniedState } from "./types";

interface CategoryMeta {
  id: "necessary" | "analytics" | "marketing" | "personalization";
  title: string;
  summary: string;
  whatWeCollect: string;
  whyWeCollect: string;
  examples: string[];
  impactIfOff: string;
  locked?: boolean;
}

const CATEGORIES: CategoryMeta[] = [
  {
    id: "necessary",
    title: "Strictly Necessary",
    summary: "Required for the site to function. Always active.",
    whatWeCollect: "Session identifiers, authentication tokens, CSRF tokens, language and accessibility preferences, security flags.",
    whyWeCollect: "To keep you signed in, secure the platform against attacks, route traffic, and remember your accessibility and language choices.",
    examples: ["Session cookies", "Authentication tokens", "CSRF protection", "Load balancing", "Accessibility preferences", "Language preference"],
    impactIfOff: "The platform cannot function without these.",
    locked: true,
  },
  {
    id: "analytics",
    title: "Analytics",
    summary: "Helps us understand how the platform is used so we can improve it.",
    whatWeCollect: "Aggregated page views, click events, performance metrics, session duration, anonymized usage patterns.",
    whyWeCollect: "To identify slow pages, broken flows, and which features get used — so we can fix problems and prioritize improvements.",
    examples: ["Google Analytics (GA4)", "Performance monitoring", "Heatmaps", "Session analytics"],
    impactIfOff: "We won't be able to measure how well the site performs for you, but no feature is affected.",
  },
  {
    id: "marketing",
    title: "Marketing & Advertising",
    summary: "Used to measure ad campaigns and show you relevant ads on other platforms.",
    whatWeCollect: "Conversion events, audience identifiers, ad-click attribution, remarketing signals.",
    whyWeCollect: "To measure whether our marketing reaches the right audience and to avoid showing you irrelevant ads.",
    examples: ["Meta Pixel", "Google Ads tag", "LinkedIn Insight Tag", "TikTok Pixel", "Remarketing", "Conversion tracking"],
    impactIfOff: "You may still see ads from us, but they won't be personalized and we won't measure their effectiveness.",
  },
  {
    id: "personalization",
    title: "Personalization & AI Optimization",
    summary: "Tailors the product experience and improves AI-generated recommendations for you.",
    whatWeCollect: "Feature usage patterns, navigation history within the app, preference signals.",
    whyWeCollect: "To adapt onboarding, dashboards, and AI suggestions to how you actually use the product.",
    examples: ["Adaptive onboarding", "Personalized AI recommendations", "Remembered preferences", "Experience personalization"],
    impactIfOff: "Your experience will still work but won't adapt to your usage over time.",
  },
];

export default function PreferencesModal() {
  const {
    state, isPrefsOpen, closePreferences,
    acceptAll, rejectNonEssential, updateCategories,
  } = useConsent();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Local draft state so the user can toggle without committing until
  // they click Save. Seeds from the current consent state, or all-off
  // when there is no prior decision.
  const seed = state ?? defaultDeniedState();
  const [draft, setDraft] = useState({
    analytics:       seed.analytics,
    marketing:       seed.marketing,
    personalization: seed.personalization,
  });

  // Re-sync draft whenever the modal is (re)opened.
  useEffect(() => {
    if (!isPrefsOpen) return;
    const s = state ?? defaultDeniedState();
    setDraft({
      analytics:       s.analytics,
      marketing:       s.marketing,
      personalization: s.personalization,
    });
  }, [isPrefsOpen, state]);

  // Focus management — trap focus inside the dialog while open.
  useEffect(() => {
    if (!isPrefsOpen) return;
    previouslyFocused.current = document.activeElement as HTMLElement;
    const first = dialogRef.current?.querySelector<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    );
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); closePreferences(); return; }
      if (e.key !== "Tab") return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      );
      if (!focusables || focusables.length === 0) return;
      const f0 = focusables[0];
      const fN = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === f0) { e.preventDefault(); fN.focus(); }
      else if (!e.shiftKey && document.activeElement === fN) { e.preventDefault(); f0.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [isPrefsOpen, closePreferences]);

  const save = useCallback(() => {
    updateCategories(draft, "custom");
    closePreferences();
  }, [draft, updateCategories, closePreferences]);

  if (!isPrefsOpen) return null;

  return (
    <>
      <div className="consent-backdrop" onClick={closePreferences} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="consent-modal"
      >
        <header className="consent-modal-header">
          <div>
            <h2 id={titleId} className="consent-modal-title">Privacy preferences</h2>
            <p className="consent-modal-subtitle">
              Choose which categories you allow. You can change these at any time.
            </p>
          </div>
          <button
            type="button"
            className="consent-icon-btn"
            aria-label="Close privacy preferences"
            onClick={closePreferences}
          >
            <CloseGlyph />
          </button>
        </header>

        <div className="consent-modal-body">
          {CATEGORIES.map((c) => (
            <CategoryRow
              key={c.id}
              meta={c}
              checked={c.locked ? true : draft[c.id as Exclude<typeof c.id, "necessary">]}
              onChange={(v) => {
                if (c.locked) return;
                setDraft((d) => ({ ...d, [c.id]: v }));
              }}
            />
          ))}
          <p className="consent-modal-legal">
            See our{" "}
            <a href="/privacy" className="consent-link">Privacy Policy</a>
            {" "}and{" "}
            <a href="/terms" className="consent-link">Terms of Service</a>
            {" "}for more information. Your consent is stored on this device
            and applies across <code>tweaxly.com</code>.
          </p>
        </div>

        <footer className="consent-modal-footer">
          <button type="button" className="consent-btn consent-btn-secondary" onClick={rejectNonEssential}>
            Reject non-essential
          </button>
          <div className="consent-modal-footer-right">
            <button type="button" className="consent-btn consent-btn-secondary" onClick={acceptAll}>
              Accept all
            </button>
            <button type="button" className="consent-btn consent-btn-primary" onClick={save}>
              Save preferences
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}

function CategoryRow({
  meta, checked, onChange,
}: {
  meta: CategoryMeta;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  return (
    <div className="consent-category">
      <div className="consent-category-head">
        <button
          type="button"
          className="consent-category-disclosure"
          aria-expanded={open}
          aria-controls={detailsId}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="consent-chevron" aria-hidden="true">{open ? "▾" : "▸"}</span>
          <span className="consent-category-title">{meta.title}</span>
          {meta.locked ? (
            <span className="consent-pill" aria-label="Always active">Always active</span>
          ) : null}
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={`${meta.title} consent`}
          disabled={meta.locked}
          className={`consent-switch ${meta.locked ? "is-locked" : ""}`}
          onClick={() => !meta.locked && onChange(!checked)}
        />
      </div>
      <p className="consent-category-summary">{meta.summary}</p>
      {open ? (
        <div id={detailsId} className="consent-category-details">
          <DetailItem label="What is collected" value={meta.whatWeCollect} />
          <DetailItem label="Why we collect it" value={meta.whyWeCollect} />
          <DetailItem
            label="Examples"
            value={<ul className="consent-examples">{meta.examples.map((e) => <li key={e}>{e}</li>)}</ul>}
          />
          <DetailItem label="If you turn this off" value={meta.impactIfOff} />
        </div>
      ) : null}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="consent-detail-item">
      <div className="consent-detail-label">{label}</div>
      <div className="consent-detail-value">{value}</div>
    </div>
  );
}

function CloseGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
