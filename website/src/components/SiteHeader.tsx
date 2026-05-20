// Shared site header — same nav on every public page so users can
// move between Home / About / Pricing / FAQ / Testimonials / Contact
// without falling back to a "← Back to home" link.

import Link from "next/link";
import Logo from "@/components/Logo";

const PRODUCT_URL = "https://app.tweaxly.com";
const SIGNUP_URL  = `${PRODUCT_URL}/register`;
const LOGIN_URL   = `${PRODUCT_URL}/login`;

interface Props {
  // Highlighted-route hint — currently a no-op visually, kept as a
  // hook for future active-state styling without touching every page.
  active?: "home" | "about" | "pricing" | "faq" | "testimonials" | "contact";
}

const NAV: { id: NonNullable<Props["active"]>; href: string; label: string }[] = [
  { id: "home",         href: "/",             label: "Home" },
  { id: "about",        href: "/about",        label: "About" },
  { id: "pricing",      href: "/pricing",      label: "Pricing" },
  { id: "faq",          href: "/faq",          label: "FAQ" },
  { id: "testimonials", href: "/testimonials", label: "Testimonials" },
  { id: "contact",      href: "/contact",      label: "Contact" },
];

export default function SiteHeader({ active }: Props) {
  return (
    <header className="container-wide pt-6 sm:pt-8 pb-4 flex items-center justify-between gap-2 sm:gap-3">
      <div className="min-w-0">
        <Link href="/" aria-label="Tweaxly home">
          <Logo size="md" showTagline />
        </Link>
      </div>

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

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <a href={LOGIN_URL}  className="btn-ghost text-xs sm:text-sm px-3 sm:px-4">Log in</a>
        <a href={SIGNUP_URL} className="btn-brand text-xs sm:text-sm px-3 sm:px-4">Sign up</a>
      </div>
    </header>
  );
}
