import type { Metadata } from "next";
import "./globals.css";
import "./a11y.css";
import "./consent.css";
import { getServerLocale } from "@/lib/i18n/server";
import { dirFor } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/client";
import { AccessibilityProvider, AccessibilityWidget, A11Y_INIT_SCRIPT } from "@/lib/a11y";
import {
  ConsentProvider, ConsentBanner, PreferencesModal, CONSENT_INIT_SCRIPT,
} from "@/lib/consent";
import { detectIpCountry } from "@/lib/geoip";

export const metadata: Metadata = {
  title: "TWEAXLY - AI Financial Intelligence",
  description:
    "TWEAXLY: AI Financial Intelligence - financial clarity for SMB owners.",
};

// Sets the saved theme on <html> BEFORE the first paint, so users who
// previously chose light mode don't see a one-frame flash of dark.
const THEME_INIT_SCRIPT = `
(function(){try{
  var t = localStorage.getItem('theme');
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
}catch(e){}})();
`;

export default async function RootLayout({
  children,
}: { children: React.ReactNode }) {
  const locale = await getServerLocale();
  const dir = dirFor(locale);
  // Cookie record gets stamped with the visitor's CDN-detected country
  // so the audit trail captures *where* the consent was given.
  const region = detectIpCountry();
  return (
    <html lang={locale} dir={dir}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: CONSENT_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: A11Y_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <I18nProvider locale={locale}>
          <ConsentProvider region={region}>
            <AccessibilityProvider>
              {children}
              <AccessibilityWidget />
              <ConsentBanner />
              <PreferencesModal />
            </AccessibilityProvider>
          </ConsentProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
