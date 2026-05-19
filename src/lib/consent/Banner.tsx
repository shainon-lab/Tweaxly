"use client";

// Initial consent banner. Renders only when the user has not yet
// decided (or their saved decision is stale against the current
// version). Three actions, all with equal visual weight per GDPR
// no-dark-pattern guidance: Accept All, Reject Non-Essential, Manage.

import { useEffect, useState } from "react";
import { useConsent } from "./provider";

export default function ConsentBanner() {
  const { needsBanner, acceptAll, rejectNonEssential, openPreferences } = useConsent();
  // Mount guard so we don't render the banner during the brief window
  // before `needsBanner` is reconciled with the cookie.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted || !needsBanner) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-banner-title"
      aria-describedby="consent-banner-body"
      className="consent-banner"
    >
      <div className="consent-banner-inner">
        <div className="consent-banner-copy">
          <h2 id="consent-banner-title" className="consent-banner-title">
            Your privacy choices
          </h2>
          <p id="consent-banner-body" className="consent-banner-body">
            We use cookies and similar technologies to operate the site,
            measure performance, and (with your consent) personalize
            content and measure marketing. Strictly necessary cookies
            are always active. You can change your choice at any time
            via &ldquo;Privacy Preferences&rdquo; in the footer.
            {" "}
            <a href="/privacy" className="consent-link">Privacy Policy</a>.
          </p>
        </div>
        <div className="consent-banner-actions" role="group" aria-label="Consent actions">
          <button
            type="button"
            className="consent-btn consent-btn-secondary"
            onClick={rejectNonEssential}
          >
            Reject non-essential
          </button>
          <button
            type="button"
            className="consent-btn consent-btn-secondary"
            onClick={openPreferences}
          >
            Manage preferences
          </button>
          <button
            type="button"
            className="consent-btn consent-btn-primary"
            onClick={acceptAll}
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
