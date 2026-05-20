// Article body primitives. Articles consume these from JSX so each
// piece can compose callouts, quotes, lead paragraphs, and product
// CTAs without an MDX toolchain.

import Link from "next/link";

// Standard prose paragraph - used inside an .article-body container
// where typography is styled globally.

export function Lead({ children }: { children: React.ReactNode }) {
  return <p className="article-lead">{children}</p>;
}

export function Callout({
  variant = "info",
  title,
  children,
}: {
  variant?: "info" | "warn" | "success";
  title?: string;
  children: React.ReactNode;
}) {
  const tone =
    variant === "warn"    ? "border-warn/40 bg-warn/5"       :
    variant === "success" ? "border-good/40 bg-good/5"       :
                            "border-brand-purple/30 bg-brand-purple/5";
  const label =
    variant === "warn"    ? "Heads up"   :
    variant === "success" ? "Takeaway"   : "Note";
  return (
    <aside className={`my-8 rounded-2xl border ${tone} p-5`}>
      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400 mb-2">
        {title ?? label}
      </div>
      <div className="text-slate-200 text-base leading-relaxed">{children}</div>
    </aside>
  );
}

export function PullQuote({
  children,
  attribution,
}: {
  children: React.ReactNode;
  attribution?: string;
}) {
  return (
    <blockquote className="my-10 relative pl-6 border-l-2 border-brand-purple/60">
      <div className="text-xl sm:text-2xl text-white font-medium leading-snug">
        {children}
      </div>
      {attribution ? (
        <div className="mt-3 text-xs uppercase tracking-[0.15em] text-slate-500">
          {attribution}
        </div>
      ) : null}
    </blockquote>
  );
}

export function ProductCta({
  title,
  body,
  href,
  cta,
}: {
  title:   string;
  body:    string;
  href:    string;
  cta:     string;
}) {
  return (
    <div className="my-10 rounded-2xl border border-brand-purple/30 bg-gradient-to-br from-brand-purple/10 via-transparent to-brand-teal/10 p-6 sm:p-7">
      <div className="text-base sm:text-lg font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm text-slate-300 leading-relaxed">{body}</p>
      <div className="mt-5">
        {href.startsWith("/") ? (
          <Link href={href} className="btn-brand text-sm px-5 py-2.5 inline-flex">
            {cta} →
          </Link>
        ) : (
          <a href={href} className="btn-brand text-sm px-5 py-2.5 inline-flex">
            {cta} →
          </a>
        )}
      </div>
    </div>
  );
}

// Section heading variants. We export thin wrappers (H2/H3) so the
// article body composes from these instead of bare HTML tags - that
// lets the article TOC pick up consistent ids via React clone, and
// keeps spacing uniform across articles.

export function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mt-14 mb-5 scroll-mt-24">
      {children}
    </h2>
  );
}

export function H3({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="text-xl font-semibold tracking-tight text-white mt-10 mb-3 scroll-mt-24">
      {children}
    </h3>
  );
}

// Inline link to a product page or another article. Keeps internal
// linking visually consistent.
export function ArticleLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-brand-purple hover:underline underline-offset-2">
      {children}
    </Link>
  );
}
