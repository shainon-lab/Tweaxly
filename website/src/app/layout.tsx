import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./a11y.css";
import { AccessibilityProvider, AccessibilityWidget, A11Y_INIT_SCRIPT } from "@/lib/a11y";

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
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Restore the saved a11y preferences before first paint to avoid
            FOUC for contrast / font-scale users. */}
        <script dangerouslySetInnerHTML={{ __html: A11Y_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <AccessibilityProvider>
          {children}
          <AccessibilityWidget />
        </AccessibilityProvider>
      </body>
    </html>
  );
}
