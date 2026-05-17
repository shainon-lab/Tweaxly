import type { Metadata } from "next";
import "./globals.css";
import { getServerLocale } from "@/lib/i18n/server";
import { dirFor } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/client";

export const metadata: Metadata = {
  title: "TWEAXLY — AI-Powered Business Intelligence",
  description:
    "TWEAXLY: AI-powered business intelligence and financial clarity for SMB owners.",
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
  return (
    <html lang={locale} dir={dir}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
