"use client";

// Mobile navigation drawer. Sits on the right side of the SiteHeader
// on viewports below the md breakpoint; the desktop nav (visible at
// md and up) keeps working unchanged.
//
// The drawer must render via a portal to document.body. SiteHeader
// uses `backdrop-filter: blur(...)` which establishes a CSS
// containing block - that traps `position: fixed` descendants
// inside the header instead of the viewport, so a drawer rendered
// inline would appear (or disappear) inside the tiny header bar.
// Portal escapes the containing block entirely.
//
// UX:
//   • Hamburger toggles a right-side drawer.
//   • Backdrop behind drawer dims + blurs the page.
//   • ESC closes; click-outside closes.
//   • Body scroll locked while open; focus trapped inside the drawer.
//   • Clicking any link closes the drawer.
//   • Primary "Get Started" + secondary "Sign In" CTAs pinned at the
//     bottom of the drawer.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const PRODUCT_URL = "https://app.tweaxly.com";
const SIGNUP_URL  = `${PRODUCT_URL}/register`;
const LOGIN_URL   = `${PRODUCT_URL}/login`;

// Resources intentionally lives in the footer only - it doesn't
// appear in the top nav or the mobile drawer. Keeps the primary nav
// short and focused on conversion-relevant pages.
const PAGES: { href: string; label: string }[] = [
  { href: "/",             label: "Home" },
  { href: "/about",        label: "About" },
  { href: "/features",     label: "Features" },
  { href: "/pricing",      label: "Pricing" },
  { href: "/faq",          label: "FAQ" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/contact",      label: "Contact" },
];

// Homepage anchor sections - useful entry points from the mobile
// menu when the user is on the homepage. On other pages these still
// resolve back to "/" + anchor, so they always work.
const SECTIONS: { href: string; label: string }[] = [
  { href: "/#signals",      label: "Business Signals" },
  { href: "/#advisory",     label: "AI Advisor" },
  { href: "/#forecast",     label: "Forecasting" },
  { href: "/#how-it-works", label: "How it works" },
];

interface Props {
  active?: string;
}

export default function MobileNav({ active }: Props) {
  const [open, setOpen] = useState(false);
  // `mounted` guards against SSR - createPortal needs the document
  // node which isn't available during the server render pass.
  const [mounted, setMounted] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Body scroll lock + focus management.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";
    const first = drawerRef.current?.querySelector<HTMLElement>(
      "a, button, [tabindex]:not([tabindex='-1'])",
    );
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); setOpen(false); return; }
      if (e.key !== "Tab") return;
      const focusables = drawerRef.current?.querySelectorAll<HTMLElement>(
        "a, button, [tabindex]:not([tabindex='-1'])",
      );
      if (!focusables || focusables.length === 0) return;
      const f0 = focusables[0];
      const fN = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === f0) { e.preventDefault(); fN.focus(); }
      else if (!e.shiftKey && document.activeElement === fN) { e.preventDefault(); f0.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center w-10 h-10 rounded-md text-slate-200 hover:bg-ink-700 transition"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
      >
        <BurgerGlyph />
      </button>

      {open && mounted ? createPortal(
        <>
          {/* Z-indexes have to sit ABOVE the existing global floating
              UI to avoid a mess on mobile:
                .consent-banner  9985
                .consent-modal   9987
                .a11y-fab        9990  ← was bleeding over the drawer
                .a11y-dialog     9992
              We park the backdrop at 9995 and the drawer at 9996
              so the mobile menu sits on top of everything except
              system-level overlays (none higher exist). */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-mobile-fade"
            style={{ zIndex: 9995 }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            style={{ zIndex: 9996 }}
            className="fixed top-0 right-0 bottom-0 w-[88%] max-w-sm bg-ink-900 border-l border-line flex flex-col shadow-2xl animate-mobile-drawer"
          >
            {/* Header - close button */}
            <div className="flex items-center justify-between p-5 border-b border-line">
              <div className="text-sm font-semibold tracking-wide text-slate-200">Menu</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-md text-slate-300 hover:bg-ink-700 transition"
                aria-label="Close menu"
              >
                <CloseGlyph />
              </button>
            </div>

            {/* Page links */}
            <nav className="flex-1 overflow-y-auto px-5 py-6">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-3">Pages</div>
              <ul className="flex flex-col gap-1">
                {PAGES.map((p) => {
                  const isActive = active === p.label.toLowerCase();
                  return (
                    <li key={p.href}>
                      <Link
                        href={p.href}
                        onClick={() => setOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex items-center justify-between text-base py-3 px-3 -mx-3 rounded-lg transition ${
                          isActive
                            ? "text-white bg-accent-soft"
                            : "text-slate-200 hover:bg-ink-700"
                        }`}
                      >
                        <span>{p.label}</span>
                        <span className="text-slate-500" aria-hidden="true">→</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mt-8 mb-3">Sections</div>
              <ul className="flex flex-col gap-1">
                {SECTIONS.map((s) => (
                  <li key={s.href}>
                    <Link
                      href={s.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between text-sm py-2.5 px-3 -mx-3 rounded-lg text-slate-300 hover:bg-ink-700 transition"
                    >
                      <span>{s.label}</span>
                      <span className="text-slate-500" aria-hidden="true">↓</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* CTAs pinned at the bottom */}
            <div className="border-t border-line p-5 flex flex-col gap-3">
              <a
                href={SIGNUP_URL}
                onClick={() => setOpen(false)}
                className="btn-brand text-base px-5 py-3 text-center"
              >
                Get Started
              </a>
              <a
                href={LOGIN_URL}
                onClick={() => setOpen(false)}
                className="btn-ghost text-base px-5 py-3 text-center"
              >
                Sign In
              </a>
            </div>
          </div>
        </>,
        document.body,
      ) : null}
    </div>
  );
}

function BurgerGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
