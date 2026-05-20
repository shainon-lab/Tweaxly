// Shared site header - same nav on every public page so users can
// move between Home / About / Pricing / FAQ / Testimonials / Contact
// without falling back to a "← Back to home" link.
//
// The header is sticky on mobile so the hamburger stays in reach as
// the user scrolls. Desktop nav is unchanged; the <MobileNav> client
// component renders the hamburger + drawer for viewports below md.

import Link from "next/link";
import Logo from "@/components/Logo";
import MobileNav from "@/components/MobileNav";

const PRODUCT_URL = "https://app.tweaxly.com";
const SIGNUP_URL  = `${PRODUCT_URL}/register`;
const LOGIN_URL   = `${PRODUCT_URL}/login`;

interface Props {
  // Highlighted-route hint - currently a no-op visually, kept as a
  // hook for future active-state styling without touching every page.
  // "resources" stays as a valid value so resources sub-pages can
  // still pass an active hint, even though the header no longer
  // exposes that nav entry (Resources lives in the footer now).
  active?: "home" | "about" | "features" | "pricing" | "faq" | "testimonials" | "contact" | "resources";
}

const NAV: { id: NonNullable<Props["active"]>; href: string; label: string }[] = [
  { id: "home",         href: "/",             label: "Home" },
  { id: "about",        href: "/about",        label: "About" },
  { id: "features",     href: "/features",     label: "Features" },
  { id: "pricing",      href: "/pricing",      label: "Pricing" },
  { id: "faq",          href: "/faq",          label: "FAQ" },
  { id: "testimonials", href: "/testimonials", label: "Testimonials" },
  { id: "contact",      href: "/contact",      label: "Contact" },
];

export default function SiteHeader({ active }: Props) {
  return (
    // Sticky on mobile so the hamburger stays reachable while
    // scrolling. Backdrop-blur keeps the page background visible
    // through the header for a modern SaaS feel.
    <header className="sticky top-0 z-30 backdrop-blur-md bg-brand-navy/70 border-b border-line/40 supports-[backdrop-filter]:bg-brand-navy/50">
      <div className="container-wide pt-4 sm:pt-6 pb-3 sm:pb-4 flex items-center justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <Link href="/" aria-label="Tweaxly home">
            <Logo size="md" showTagline />
          </Link>
        </div>

        {/* Desktop nav - visible md+ only. */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
          {NAV.map((n) => (
            <Link
              key={n.id}
              href={n.href}
              aria-current={active === n.id ? "page" : undefined}
              className={`hover:text-white transition ${active === n.id ? "text-white" : ""}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Desktop action buttons - visible md+ only. */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <a href={LOGIN_URL}  className="btn-ghost text-sm px-4">Log in</a>
          <a href={SIGNUP_URL} className="btn-brand text-sm px-4">Sign up</a>
        </div>

        {/* Mobile - hamburger + drawer. Hidden at md and up. */}
        <MobileNav active={active} />
      </div>
    </header>
  );
}
