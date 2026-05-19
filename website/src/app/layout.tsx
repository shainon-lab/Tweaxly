import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./a11y.css";
import "./consent.css";
import { AccessibilityProvider, AccessibilityWidget, A11Y_INIT_SCRIPT } from "@/lib/a11y";
import {
  ConsentProvider, ConsentBanner, PreferencesModal, CONSENT_INIT_SCRIPT,
} from "@/lib/consent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TWEAXLY — AI-Powered Business Intelligence",
  description:
    "TWEAXLY gives small business owners financial clarity in plain English: dashboards, forecasts, alerts, and a built-in AI advisor that knows your numbers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Marketing site pages stay static — region is captured at decision
  // time client-side by the consent provider (or left null on the
  // marketing site, where the cookie's region is enriched once the
  // user later visits the authenticated product).
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Both init scripts must run before first paint. Consent
            initializes the GCM v2 default-denied state; a11y restores
            user preferences. Order matters only insofar as both should
            land before any tracking script ever has a chance to fire. */}
        <script dangerouslySetInnerHTML={{ __html: CONSENT_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: A11Y_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <ConsentProvider>
          <AccessibilityProvider>
            {children}
            <AccessibilityWidget />
            <ConsentBanner />
            <PreferencesModal />
          </AccessibilityProvider>
        </ConsentProvider>
      </body>
    </html>
  );
}
