// Centralized JSON-LD schema generators for the Learning Center.
//
// Every Article, Category landing page, and Resources homepage emits
// one or more of these structured-data blobs server-side. They're the
// single most cost-effective lever we have for both classic SEO
// (rich results, sitelinks, FAQ accordions) and GEO (generative
// engines that read schema.org markup to decide what to cite).

import type { ArticleMeta, CategoryMeta, FAQItem } from "@/content/resources/types";

const SITE_ORIGIN = "https://tweaxly.com";
const ORG_NAME    = "Tweaxly";
const ORG_LOGO    = `${SITE_ORIGIN}/og-image.svg`;
const DEFAULT_OG  = `${SITE_ORIGIN}/og-share.png`;

// Article schema. Includes both Article and BreadcrumbList types via
// the @graph wrapper so we emit them as a single script tag.
export function articleJsonLd({
  article, categoryLabel,
}: {
  article: ArticleMeta;
  categoryLabel: string;
}) {
  const url = `${SITE_ORIGIN}/resources/${article.category}/${article.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id":   `${url}#article`,
        headline:      article.title,
        description:   article.seo.description,
        datePublished: article.publishedAt,
        dateModified:  article.updatedAt ?? article.publishedAt,
        author:        { "@type": "Organization", name: article.author.name },
        publisher: {
          "@type": "Organization",
          name:    ORG_NAME,
          url:     SITE_ORIGIN,
          logo:    { "@type": "ImageObject", url: ORG_LOGO },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        image:            [DEFAULT_OG],
        keywords:         article.seo.keywords.join(", "),
        articleSection:   categoryLabel,
        inLanguage:       "en",
        wordCount:        Math.max(300, article.readingTime * 220),
      },
      breadcrumbGraph([
        { name: "Home",      url: `${SITE_ORIGIN}/` },
        { name: "Resources", url: `${SITE_ORIGIN}/resources` },
        { name: categoryLabel, url: `${SITE_ORIGIN}/resources/${article.category}` },
        { name: article.title, url },
      ]),
    ],
  };
}

// Standalone BreadcrumbList - used by category landing pages.
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return { "@context": "https://schema.org", ...breadcrumbGraph(items) };
}

function breadcrumbGraph(items: { name: string; url: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type":  "ListItem",
      position: i + 1,
      name:     it.name,
      item:     it.url,
    })),
  };
}

// FAQPage schema. Emitted both at the article level (from meta.faq)
// and on category landing pages (from CategoryMeta.faq). Generative
// engines pick this up reliably for answer-extraction.
export function faqJsonLd(faq: FAQItem[]) {
  if (!faq?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type":    "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type":   "Question",
      name:      f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

// CollectionPage schema for category landing pages. Lists the
// articles in the category as a structured ItemList so search
// engines understand the page is a curated index, not a single
// content piece.
export function collectionJsonLd({
  category, articles,
}: {
  category: CategoryMeta;
  articles: Pick<ArticleMeta, "slug" | "title" | "excerpt" | "category">[];
}) {
  const url = `${SITE_ORIGIN}/resources/${category.id}`;
  return {
    "@context": "https://schema.org",
    "@type":    "CollectionPage",
    "@id":      `${url}#collection`,
    name:        category.label,
    description: category.blurb,
    url,
    isPartOf:    { "@type": "WebSite", name: ORG_NAME, url: SITE_ORIGIN },
    hasPart: articles.map((a) => ({
      "@type":      "Article",
      url:          `${SITE_ORIGIN}/resources/${a.category}/${a.slug}`,
      headline:     a.title,
      description:  a.excerpt,
    })),
  };
}

// ItemList schema for category landing pages. Sits alongside the
// CollectionPage emission so AI engines that key off ItemList
// specifically (Google's product/article carousels, OpenAI's
// citation crawler) pick the list up directly without traversing
// CollectionPage.hasPart. The two blobs are semantically equivalent
// but engines differ in what they expect at the top level.
export function itemListJsonLd({
  category, articles,
}: {
  category: CategoryMeta;
  articles: Pick<ArticleMeta, "slug" | "title" | "excerpt" | "category">[];
}) {
  const url = `${SITE_ORIGIN}/resources/${category.id}`;
  return {
    "@context": "https://schema.org",
    "@type":    "ItemList",
    "@id":      `${url}#itemlist`,
    name:        `${category.label} - articles + glossary`,
    description: category.blurb,
    numberOfItems: articles.length,
    itemListElement: articles.map((a, i) => ({
      "@type":   "ListItem",
      position:  i + 1,
      url:       `${SITE_ORIGIN}/resources/${a.category}/${a.slug}`,
      name:      a.title,
      // `item` mirrors `url` so engines that read either property
      // get the right target.
      item:      `${SITE_ORIGIN}/resources/${a.category}/${a.slug}`,
    })),
  };
}

// DefinedTerm schema for glossary entries. Semantically more
// accurate than Article for a term definition - Perplexity, ChatGPT
// and Google AI Overviews preferentially cite DefinedTerm when
// extracting "what does X mean" answers. The graph also includes
// a BreadcrumbList so the term still slots into the site hierarchy
// the way an Article would.
export function definedTermJsonLd({
  term, categoryLabel,
}: {
  term: ArticleMeta;
  categoryLabel: string;
}) {
  const url = `${SITE_ORIGIN}/resources/${term.category}/${term.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type":     "DefinedTerm",
        "@id":       `${url}#term`,
        name:        term.title,
        description: term.seo.description,
        // The excerpt is typically the one-line definition; surface
        // it as the official "definition" field so engines pick
        // the cleanest phrasing.
        url,
        inDefinedTermSet: {
          "@type": "DefinedTermSet",
          name:    `Tweaxly Business Glossary`,
          url:     `${SITE_ORIGIN}/resources/business-glossary`,
        },
        termCode:   term.slug,
        inLanguage: "en",
      },
      breadcrumbGraph([
        { name: "Home",      url: `${SITE_ORIGIN}/` },
        { name: "Resources", url: `${SITE_ORIGIN}/resources` },
        { name: categoryLabel, url: `${SITE_ORIGIN}/resources/${term.category}` },
        { name: term.title, url },
      ]),
    ],
  };
}

// Tiny <script type="application/ld+json"> renderer. Lets pages
// emit multiple schema blocks in a single React.Fragment.
export function JsonLd({ data }: { data: unknown }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
