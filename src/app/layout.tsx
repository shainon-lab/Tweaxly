import type { Metadata } from "next";
import "./globals.css";

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

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
