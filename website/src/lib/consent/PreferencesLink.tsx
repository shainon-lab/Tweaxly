"use client";

// Footer trigger - renders an inline link/button styled like the other
// footer entries that opens the preferences modal. Use anywhere the
// user might want to revisit consent (footers, settings, etc.).

import { useConsent } from "./provider";

interface Props {
  className?: string;
  children?: React.ReactNode;
}

export default function PreferencesLink({ className, children }: Props) {
  const { openPreferences } = useConsent();
  return (
    <button
      type="button"
      className={className ?? "consent-footer-link"}
      onClick={openPreferences}
    >
      {children ?? "Privacy Preferences"}
    </button>
  );
}
