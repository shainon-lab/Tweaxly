// Auto-derivation library for Learning Center internal linking.
//
// The point of this file: every linking block on every Resources
// page should pull from a single deterministic source so new
// content connects automatically without manual maintenance. Add a
// new article or glossary entry and the related-links blocks
// across the site populate based on shared category and tag
// overlap, with no per-page configuration required.
//
// The functions here are pure - they read ARTICLES from the
// registry and return ranked lists. UI components import them
// directly. No database; no runtime cost beyond an in-memory scan,
// which is negligible at 100+ entries.

import { ARTICLES, type ArticleModule } from "./index";
import type { CategoryId } from "./types";

// ─────────────────────────────────────────────────────────────────
// Article ↔ Article relations
// Used by /resources/[category]/[slug] "Related articles" block.
// Already partially handled by relatedArticles() in index.ts; this
// version is more sophisticated - it scores by tag overlap on top
// of same-category, so the suggestions stay relevant as the catalog
// grows.
// ─────────────────────────────────────────────────────────────────

export function relatedArticlesFor(
  category: CategoryId,
  slug: string,
  n = 5,
  { excludeGlossary = true }: { excludeGlossary?: boolean } = {},
): ArticleModule[] {
  const current = ARTICLES.find(
    (a) => a.meta.slug === slug && a.meta.category === category,
  );
  if (!current) return [];

  const candidates = ARTICLES.filter((a) => {
    if (a.meta.slug === slug && a.meta.category === category) return false;
    if (excludeGlossary && a.meta.kind === "glossary") return false;
    return true;
  });

  const tags = new Set(current.meta.tags.map((t) => t.toLowerCase()));

  const scored = candidates.map((a) => {
    let score = 0;
    // Same category is the strongest signal.
    if (a.meta.category === category) score += 5;
    // Tag overlap is next.
    for (const t of a.meta.tags) {
      if (tags.has(t.toLowerCase())) score += 2;
    }
    // Featured nudge so curated picks bubble up when tied.
    if (a.meta.featured) score += 0.5;
    return { a, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((x, y) => y.score - x.score || y.a.meta.publishedAt.localeCompare(x.a.meta.publishedAt))
    .slice(0, n)
    .map((s) => s.a);
}

// ─────────────────────────────────────────────────────────────────
// Article → Glossary terms
// Surfaces 5-8 glossary entries that share tags / topical overlap
// with the article. Used by the in-article "Key terms" link block
// (when a manually-curated set is absent).
// ─────────────────────────────────────────────────────────────────

export function glossaryTermsFor(
  category: CategoryId,
  slug: string,
  n = 6,
): ArticleModule[] {
  const current = ARTICLES.find(
    (a) => a.meta.slug === slug && a.meta.category === category,
  );
  if (!current) return [];

  const glossary = ARTICLES.filter((a) => a.meta.kind === "glossary");
  const tags = new Set(current.meta.tags.map((t) => t.toLowerCase()));
  const titleWords = new Set(
    current.meta.title.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3),
  );

  const scored = glossary.map((g) => {
    let score = 0;
    for (const t of g.meta.tags) {
      if (tags.has(t.toLowerCase())) score += 3;
    }
    // Title-word overlap helps surface terms whose names match the
    // article's vocabulary (e.g. "Cash Flow" article surfaces the
    // "Cash Flow" glossary entry).
    const gTerm = g.meta.title.toLowerCase();
    for (const w of titleWords) {
      if (gTerm.includes(w)) score += 1;
    }
    return { a: g, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, n)
    .map((s) => s.a);
}

// ─────────────────────────────────────────────────────────────────
// Glossary → Articles
// The mirror of glossaryTermsFor. Surfaces full articles where
// the term shows up topically - shared tags + title-word overlap
// against the term itself. Used by the "Articles using this term"
// block on glossary entry pages so the reverse direction of the
// link graph stays dense automatically.
// ─────────────────────────────────────────────────────────────────

export function articlesUsingTerm(
  category: CategoryId,
  slug: string,
  n = 6,
): ArticleModule[] {
  const term = ARTICLES.find(
    (a) => a.meta.slug === slug && a.meta.category === category,
  );
  if (!term || term.meta.kind !== "glossary") return [];

  const fullArticles = ARTICLES.filter((a) => a.meta.kind !== "glossary");
  const termTags  = new Set(term.meta.tags.map((t) => t.toLowerCase()));
  // The term's title words - "MRR", "Monthly", "Recurring", "Revenue".
  const termWords = new Set(
    term.meta.title.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2),
  );

  const scored = fullArticles.map((a) => {
    let score = 0;
    // Tag overlap is the primary signal.
    for (const t of a.meta.tags) {
      if (termTags.has(t.toLowerCase())) score += 3;
    }
    // Article title contains the term itself.
    const articleTitle = a.meta.title.toLowerCase();
    for (const w of termWords) {
      if (articleTitle.includes(w)) score += 1;
    }
    // Featured articles get a small nudge.
    if (a.meta.featured) score += 0.5;
    return { a, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((x, y) => y.score - x.score || y.a.meta.publishedAt.localeCompare(x.a.meta.publishedAt))
    .slice(0, n)
    .map((s) => s.a);
}

// ─────────────────────────────────────────────────────────────────
// Category → Key Glossary Terms
// "Key Terms in this Category" block on the category landing page.
// Picks glossary entries whose tags align most strongly with the
// articles in the category.
// ─────────────────────────────────────────────────────────────────

export function keyTermsForCategory(
  category: CategoryId,
  n = 6,
): ArticleModule[] {
  // Skip on the glossary category itself - the page is the
  // entries.
  if (category === "business-glossary") return [];

  // Build a tag-affinity profile for the category by aggregating
  // tags across the articles in the category.
  const inCategory = ARTICLES.filter(
    (a) => a.meta.category === category && a.meta.kind !== "glossary",
  );
  if (inCategory.length === 0) return [];

  const categoryTags = new Map<string, number>();
  for (const a of inCategory) {
    for (const t of a.meta.tags) {
      const key = t.toLowerCase();
      categoryTags.set(key, (categoryTags.get(key) ?? 0) + 1);
    }
  }

  const glossary = ARTICLES.filter((a) => a.meta.kind === "glossary");

  const scored = glossary.map((g) => {
    let score = 0;
    for (const t of g.meta.tags) {
      const weight = categoryTags.get(t.toLowerCase());
      if (weight) score += weight * 2;
    }
    // Beginner terms surface first in foundational categories so
    // the entry-point for the topic is approachable.
    if (g.meta.difficulty === "beginner" && (category === "financial-fundamentals" || category === "expense-management")) {
      score += 1;
    }
    return { a: g, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, n)
    .map((s) => s.a);
}

// ─────────────────────────────────────────────────────────────────
// Category → Product Features
// Used by the in-article "Practical Application" block, which is
// the contextual product CTA at the end of articles. Curated, not
// derived, because the mapping is editorial - we know which
// feature is the right CTA per category.
// ─────────────────────────────────────────────────────────────────

export interface FeatureCta {
  // Feature slug under /features/<slug>.
  slug:  string;
  label: string;
  hook:  string;
}

const FEATURE_BY_SLUG: Record<string, FeatureCta> = {
  reports:           { slug: "reports",           label: "Reports",            hook: "Turn your real numbers into clear, recurring reports without spreadsheet work." },
  "business-signals": { slug: "business-signals", label: "Business Signals",   hook: "Get notified the moment a trend in your business changes." },
  forecasting:       { slug: "forecasting",       label: "Forecasting",        hook: "Project revenue, expenses, and cash forward with explainable scenarios." },
  "ai-consultation": { slug: "ai-consultation",   label: "AI Consultation",    hook: "Ask anything about your business in plain English; get answers grounded in your data." },
  alerts:            { slug: "alerts",            label: "Alerts",             hook: "Set thresholds on your metrics and get pinged when they're crossed." },
};

// Each category maps to 1-2 product features that fit thematically.
// Used to drive the "Practical Application" block at the end of
// articles.
const CATEGORY_TO_FEATURES: Record<CategoryId, string[]> = {
  "financial-fundamentals":   ["reports", "ai-consultation"],
  "business-metrics-kpis":    ["reports", "business-signals"],
  "cash-flow-management":     ["forecasting", "business-signals"],
  "business-forecasting":     ["forecasting", "ai-consultation"],
  "expense-management":       ["reports", "alerts"],
  "business-growth":          ["forecasting", "ai-consultation"],
  "business-intelligence":    ["reports", "ai-consultation"],
  "business-signals":         ["business-signals", "alerts"],
  "small-business-operations":["reports", "ai-consultation"],
  "business-glossary":        [],
};

export function featuresForCategory(category: CategoryId): FeatureCta[] {
  return (CATEGORY_TO_FEATURES[category] ?? [])
    .map((slug) => FEATURE_BY_SLUG[slug])
    .filter((f): f is FeatureCta => !!f);
}

// ─────────────────────────────────────────────────────────────────
// Popular Glossary Terms (homepage rail)
// ─────────────────────────────────────────────────────────────────

// Curated list of the highest-traffic / highest-SEO-value glossary
// terms for surfacing on the Resources homepage and (eventually)
// the marketing homepage. Order is intentional - the first 6 should
// be the most universally-searched.
const POPULAR_GLOSSARY_SLUGS = [
  "ebitda", "arr", "mrr", "cac", "ltv",
  "cash-flow", "burn-rate", "runway",
  "revenue", "net-profit", "gross-margin", "churn-rate",
];

export function popularGlossaryTerms(n = 8): ArticleModule[] {
  const bySlug = new Map(
    ARTICLES.filter((a) => a.meta.kind === "glossary").map((a) => [a.meta.slug, a]),
  );
  const out: ArticleModule[] = [];
  for (const slug of POPULAR_GLOSSARY_SLUGS) {
    const a = bySlug.get(slug);
    if (a) out.push(a);
    if (out.length >= n) break;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────
// "Explore Tweaxly" navigation strip
// Small, consistent footer rail at the end of every article.
// ─────────────────────────────────────────────────────────────────

export const EXPLORE_LINKS: { href: string; label: string }[] = [
  { href: "/",          label: "Home"            },
  { href: "/features",  label: "Features"        },
  { href: "/pricing",   label: "Pricing"         },
  { href: "/resources", label: "Learning Center" },
  { href: "/about",     label: "About"           },
  { href: "/contact",   label: "Contact"         },
];
