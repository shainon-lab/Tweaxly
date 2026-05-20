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

// Production origin for canonical / Open Graph URLs. metadataBase
// also lets per-page metadata use relative URLs that get resolved
// here. If we ever serve from a different prod domain, update this
// single source.
const SITE_URL = "https://tweaxly.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    // Per-page metadata can override the full title via the
    // `absolute` key, or pass just the page title and the template
    // appends " | Tweaxly" automatically.
    default:  "AI Financial Intelligence for Business Owners | Tweaxly",
    template: "%s | Tweaxly",
  },
  description:
    "Tweaxly helps business owners turn financial activity into forecasts, cash flow insights, business signals, and AI-powered financial advisory.",
  applicationName: "Tweaxly",
  keywords: [
    "AI financial intelligence",
    "AI financial advisor",
    "financial forecasting",
    "cash flow forecasting",
    "business insights",
    "financial dashboard",
    "AI CFO",
    "small business financial software",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Tweaxly",
    url: SITE_URL,
    title: "AI Financial Intelligence for Business Owners | Tweaxly",
    description:
      "Tweaxly helps business owners turn financial activity into forecasts, cash flow insights, business signals, and AI-powered financial advisory.",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Tweaxly - AI Financial Intelligence" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Financial Intelligence for Business Owners | Tweaxly",
    description:
      "Tweaxly helps business owners turn financial activity into forecasts, cash flow insights, business signals, and AI-powered financial advisory.",
    images: ["/og-image.svg"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Marketing site pages stay static - region is captured at decision
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
