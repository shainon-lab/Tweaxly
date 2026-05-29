// Article body primitives. Articles consume these from JSX so each
// piece can compose callouts, quotes, lead paragraphs, definitions,
// comparison tables, FAQ blocks, and product CTAs without an MDX
// toolchain.
//
// The GEO-focused primitives (TLDR, DefinitionBlock, Formula,
// ComparisonTable, KeyTakeaways, FAQ) are designed so generative
// search engines can extract direct answers, comparisons, and
// definitions from the page reliably. They also render schema.org
// microdata where useful (FAQPage is emitted at the page level via
// the FAQItem[] in article meta - see /resources/[category]/[slug]).

import Link from "next/link";

// Standard prose paragraph - used inside an .article-body container
// where typography is styled globally.

export function Lead({ children }: { children: React.ReactNode }) {
  return <p className="article-lead">{children}</p>;
}

// "In short:" summary block. Strongly recommended at the top of every
// article - generative engines preferentially cite articles that lead
// with a direct, bulleted summary. Source list lives in meta.tldr;
// this component is also exposed for inline use mid-article.
export function TLDR({ items, label }: { items: string[]; label?: string }) {
  if (!items?.length) return null;
  return (
    <aside className="my-8 rounded-2xl border border-brand-purple/30 bg-brand-purple/5 p-5 sm:p-6">
      <div className="text-[10px] uppercase tracking-[0.18em] text-brand-purple mb-3 font-semibold">
        {label ?? "In short"}
      </div>
      <ul className="space-y-2 text-slate-100 text-[15px] sm:text-base leading-relaxed">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3">
            <span aria-hidden="true" className="shrink-0 text-brand-purple mt-1">•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

// Definition block - a direct answer to "what is X?". Used as the
// first paragraph after the TLDR. Both for human readers and for
// generative engines that extract direct definitions.
export function DefinitionBlock({
  term, children,
}: {
  term: string;
  children: React.ReactNode;
}) {
  return (
    <div className="my-6 rounded-xl border-l-4 border-brand-purple bg-ink-900/40 px-5 py-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-1.5">
        Definition
      </div>
      <p className="text-slate-100 text-base sm:text-[17px] leading-relaxed">
        <strong className="text-white">{term}</strong> {" - "}
        {children}
      </p>
    </div>
  );
}

// Formula block - centered, monospace formula with an optional
// worked example below. Renders cleanly in both light and dark
// contexts and is extractable as a unit by AI summarizers.
export function Formula({
  formula, example,
}: {
  formula: string;
  example?: React.ReactNode;
}) {
  return (
    <div className="my-7 rounded-xl border border-line bg-ink-900/40 p-5 sm:p-6">
      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-3">
        Formula
      </div>
      <pre className="text-base sm:text-lg text-white font-mono whitespace-pre-wrap leading-relaxed">
        {formula}
      </pre>
      {example ? (
        <div className="mt-4 pt-4 border-t border-line/40">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-2">
            Worked example
          </div>
          <div className="text-sm text-slate-300 leading-relaxed">{example}</div>
        </div>
      ) : null}
    </div>
  );
}

// Comparison table - critical for "X vs Y" articles where generative
// engines look for a structured side-by-side answer.
export function ComparisonTable({
  caption, columns, rows,
}: {
  caption?: string;
  columns: string[];                       // header labels
  rows: { label: string; cells: React.ReactNode[] }[];
}) {
  return (
    <div className="my-8 overflow-x-auto">
      {caption ? (
        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-2">
          {caption}
        </div>
      ) : null}
      <table className="w-full text-sm sm:text-[15px] border border-line rounded-xl overflow-hidden">
        <thead>
          <tr className="bg-ink-900/60">
            <th className="text-left font-semibold text-white px-4 py-3 border-b border-line">{" "}</th>
            {columns.map((c) => (
              <th key={c} className="text-left font-semibold text-white px-4 py-3 border-b border-line">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-ink-950/40" : ""}>
              <td className="px-4 py-3 align-top text-slate-300 font-medium border-b border-line/40">
                {row.label}
              </td>
              {row.cells.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-top text-slate-200 border-b border-line/40">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Key takeaways at the end of an article. 3-7 bullets, mirrors the
// TLDR conceptually but lands the conclusions instead of the setup.
export function KeyTakeaways({ items }: { items: string[] }) {
  if (!items?.length) return null;
  return (
    <aside className="my-10 rounded-2xl border border-good/30 bg-good/5 p-5 sm:p-6">
      <div className="text-[10px] uppercase tracking-[0.18em] text-good mb-3 font-semibold">
        Key takeaways
      </div>
      <ul className="space-y-2 text-slate-100 text-[15px] sm:text-base leading-relaxed">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3">
            <span aria-hidden="true" className="shrink-0 text-good mt-1">✓</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

// FAQ block. Pure presentational - the FAQPage JSON-LD that earns
// the rich-result is emitted at the page level from meta.faq, so this
// component just renders the disclosure list.
export function FAQ({ items, title }: { items: { q: string; a: string }[]; title?: string }) {
  if (!items?.length) return null;
  return (
    <section className="my-12 not-prose" aria-labelledby="article-faq-heading">
      <h2 id="article-faq-heading" className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mt-14 mb-5">
        {title ?? "Frequently asked questions"}
      </h2>
      <div className="space-y-2">
        {items.map((it, i) => (
          <details key={i} className="group rounded-xl border border-line bg-ink-900/40 px-5 py-4 open:bg-ink-900/60 transition">
            <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
              <span className="text-base sm:text-[17px] font-medium text-white leading-snug">
                {it.q}
              </span>
              <span aria-hidden="true" className="text-slate-400 group-open:rotate-45 transition shrink-0 mt-0.5">+</span>
            </summary>
            <div className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
              {it.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

// Breadcrumb bar shown at the top of category + article pages.
// Visual element only - the BreadcrumbList JSON-LD is emitted
// separately in the page route for SEO.
export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-slate-500 flex-wrap">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-2">
          {it.href ? (
            <Link href={it.href} className="text-brand-purple hover:underline">
              {it.label}
            </Link>
          ) : (
            <span className="text-slate-300">{it.label}</span>
          )}
          {i < items.length - 1 ? <span aria-hidden="true" className="text-slate-700">/</span> : null}
        </span>
      ))}
    </nav>
  );
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
