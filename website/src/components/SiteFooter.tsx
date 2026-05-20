// Shared marketing-site footer. Mounted on every public page so users
// always have a single, consistent place to find company links, every
// content category, and legal/consent controls.
//
// Layout:
//   • Top band: Logo (with "Your AI Business Pulse" tagline) and a
//     short brand description on the left; three link columns
//     (COMPANY / RESOURCES / LEGAL) on the right.
//   • Bottom row: copyright + brand dot.
//
// On mobile the columns stack vertically. Extra bottom padding keeps
// the floating accessibility FAB (bottom-left) from overlapping the
// last footer row.

import Link from "next/link";
import Logo from "@/components/Logo";
import { PreferencesLink } from "@/lib/consent";
import { CATEGORIES } from "@/content/resources";

const PRODUCT_URL = "https://app.tweaxly.com";
const SIGNUP_URL  = `${PRODUCT_URL}/register`;
const LOGIN_URL   = `${PRODUCT_URL}/login`;

const COMPANY: { href: string; label: string; external?: boolean }[] = [
  { href: "/about",            label: "About" },
  { href: "/features",         label: "Features" },
  { href: "/#how-it-works",    label: "How it works" },
  { href: "/pricing",          label: "Pricing" },
  { href: "/faq",              label: "FAQ" },
  { href: "/testimonials",     label: "Testimonials" },
  { href: "/contact",          label: "Contact" },
  { href: LOGIN_URL,           label: "Log in",  external: true },
  { href: SIGNUP_URL,          label: "Sign up", external: true },
];

const LEGAL: { href: string; label: string }[] = [
  { href: "/terms",         label: "Terms of Service" },
  { href: "/privacy",       label: "Privacy Policy" },
  { href: "/accessibility", label: "Accessibility Statement" },
];

// Shared link style for every column. Bare strings keep Tailwind's
// class-scan happy (no template-string interpolation in the source).
const LINK_CLS =
  "text-slate-400 hover:text-white transition-colors text-sm leading-snug";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-brand-navy mt-20">
      <div className="container-wide pt-14 pb-24 sm:pb-14">
        {/* Top band - brand block + link columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Brand block */}
          <div className="lg:col-span-4">
            <Link href="/" aria-label="Tweaxly home" className="inline-block">
              <Logo size="md" showTagline />
            </Link>
            <p className="mt-5 text-sm text-slate-400 leading-relaxed max-w-sm">
              Tweaxly turns your real financial activity into business
              signals, forecasts, and advice - in real time, using AI.
            </p>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-6">
            <FooterColumn title="Company">
              {COMPANY.map((l) =>
                l.external ? (
                  <li key={l.label}>
                    <a href={l.href} className={LINK_CLS}>{l.label}</a>
                  </li>
                ) : (
                  <li key={l.label}>
                    <Link href={l.href} className={LINK_CLS}>{l.label}</Link>
                  </li>
                ),
              )}
            </FooterColumn>

            <FooterColumn title="Resources">
              <li>
                <Link href="/resources" className={`${LINK_CLS} font-medium`}>
                  All resources
                </Link>
              </li>
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <Link href={`/resources#cat-${c.id}`} className={LINK_CLS}>
                    {c.label}
                  </Link>
                </li>
              ))}
            </FooterColumn>

            <FooterColumn title="Legal">
              {LEGAL.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={LINK_CLS}>{l.label}</Link>
                </li>
              ))}
              <li>
                {/* Client component - opens the consent preferences
                    modal so users can change their cookie choices at
                    any time. Required by GDPR/CCPA. */}
                <PreferencesLink className={`${LINK_CLS} consent-footer-link`}>
                  Privacy Preferences
                </PreferencesLink>
              </li>
            </FooterColumn>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-12 pt-6 border-t border-line flex items-center justify-between flex-wrap gap-3 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} TWEAXLY. All rights reserved.</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
            Your AI Business Pulse
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-semibold mb-4">
        {title}
      </div>
      <ul className="flex flex-col gap-2.5 text-sm">{children}</ul>
    </div>
  );
}
