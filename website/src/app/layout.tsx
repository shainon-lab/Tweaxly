import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./a11y.css";
import "./consent.css";
import { AccessibilityProvider, AccessibilityWidget, A11Y_INIT_SCRIPT } from "@/lib/a11y";
import {
  ConsentProvider, ConsentBanner, PreferencesModal, CONSENT_INIT_SCRIPT,
} from "@/lib/consent";
import SiteFooter from "@/components/SiteFooter";

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

// ─────────────────────────────────────────────────────────────────────
// Site-wide JSON-LD schemas
// ─────────────────────────────────────────────────────────────────────
// These three live on EVERY page (injected via <head> below):
//   • Organization        - canonical identity for Tweaxly the company
//   • WebSite             - identity for tweaxly.com, plus the
//                           SearchAction sitelink-searchbox hint
//   • SoftwareApplication - global product schema (the /features page
//                           and any /features/[slug] page also emit
//                           their own page-scoped SoftwareApplication
//                           with a featureList; both can coexist)
//
// The Organization.logo currently points at /og-image.svg because no
// dedicated logo.png ships yet. Once a rasterised /logo.png is added
// to /public, swap the path here for better Google Knowledge Graph
// support (SVG works but raster is preferred).

const SITE_LOGO_URL = `${SITE_URL}/og-image.svg`;

const SITE_DESCRIPTION =
  "AI that understands your business. Turn your data into real-time insights, forecasts, signals, and AI-powered decisions - built for SMB owners.";

const SITE_ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type":    "Organization",
  name:       "Tweaxly",
  url:        SITE_URL,
  logo:       SITE_LOGO_URL,
  sameAs:     [],
  address: {
    "@type":         "PostalAddress",
    addressCountry:  "US",
  },
  areaServed: {
    "@type": "Country",
    name:    "United States",
  },
  foundingDate:        "2026",
  description:         SITE_DESCRIPTION,
  applicationCategory: "BusinessApplication",
  operatingSystem:     "Web",
};

const SITE_WEBSITE_SCHEMA = {
  "@context":  "https://schema.org",
  "@type":     "WebSite",
  name:        "Tweaxly",
  url:         SITE_URL,
  inLanguage:  "en-US",
  potentialAction: {
    "@type":       "SearchAction",
    target:        `${SITE_URL}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const SITE_SOFTWARE_APP_SCHEMA = {
  "@context":             "https://schema.org",
  "@type":                "SoftwareApplication",
  name:                   "Tweaxly",
  applicationCategory:    "BusinessApplication",
  applicationSubCategory: "Financial Analytics Software",
  operatingSystem:        "Web",
  url:                    SITE_URL,
  offers: {
    "@type":       "Offer",
    price:         "0",
    priceCurrency: "USD",
  },
  audience: {
    "@type":      "BusinessAudience",
    audienceType: "Small and Medium Businesses",
  },
  areaServed: {
    "@type": "Country",
    name:    "United States",
  },
  inLanguage:  "en-US",
  description: "AI that understands your business. Tweaxly turns SMB data into real-time insights, forecasts, signals, and AI-powered decisions on revenue, expenses, cash flow, and trends.",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    // Per-page metadata can override the full title via the
    // `absolute` key, or pass just the page title and the template
    // appends " | Tweaxly" automatically.
    default:  "AI That Understands Your Business | Tweaxly",
    template: "%s | Tweaxly",
  },
  description:
    "Turn your business data into real-time insights, forecasts, signals, and AI-powered decisions. Tweaxly is the AI that understands your business.",
  applicationName: "Tweaxly",
  keywords: [
    "AI business intelligence",
    "AI for business owners",
    "business data insights",
    "real-time business insights",
    "AI business decisions",
    "financial forecasting",
    "cash flow forecasting",
    "business signals",
    "AI financial advisor",
    "AI CFO",
    "small business financial software",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Tweaxly",
    url: SITE_URL,
    title: "AI That Understands Your Business | Tweaxly",
    description:
      "Turn your business data into real-time insights, forecasts, signals, and AI-powered decisions. Tweaxly is the AI that understands your business.",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Tweaxly - AI That Understands Your Business" }],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI That Understands Your Business | Tweaxly",
    description:
      "Turn your business data into real-time insights, forecasts, signals, and AI-powered decisions. Tweaxly is the AI that understands your business.",
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
      // The consent + a11y init scripts run before React hydrates
      // and stamp data-consent / data-a11y-* attributes + the
      // --a11y-font-scale CSS var onto <html> so styling applies
      // without a flash. Tell React to ignore the diff on this one
      // node - the mismatch is intentional, isolated, and never
      // applies to children.
      suppressHydrationWarning
    >
      <head>
        {/* Both init scripts must run before first paint. Consent
            initializes the GCM v2 default-denied state; a11y restores
            user preferences. Order matters only insofar as both should
            land before any tracking script ever has a chance to fire. */}
        <script dangerouslySetInnerHTML={{ __html: CONSENT_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: A11Y_INIT_SCRIPT }} />
        {/* Site-wide JSON-LD: Organization, WebSite (with SearchAction)
            and SoftwareApplication. Per-page schemas (FAQPage,
            BreadcrumbList, Article, etc.) are added by the individual
            routes - these three are the global identity surface. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_ORG_SCHEMA) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_WEBSITE_SCHEMA) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_SOFTWARE_APP_SCHEMA) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <ConsentProvider>
          <AccessibilityProvider>
            {/* Every page renders its own <main id="main-content">.
                The shared SiteFooter sits as a sibling below so it
                appears on every public route automatically - no need
                to remember to mount it per-page. */}
            {children}
            <SiteFooter />
            <AccessibilityWidget />
            <ConsentBanner />
            <PreferencesModal />
          </AccessibilityProvider>
        </ConsentProvider>
      </body>
    </html>
  );
}
