// Dynamic /llms-full.txt — full content inventory for AI systems
// (Anthropic / OpenAI / Google AI Overviews / Perplexity etc.) to
// discover everything we publish without scraping the HTML site.
//
// Auto-regenerates from the resources registry on every request, so
// new articles + glossary entries appear the moment they're added to
// `src/content/resources` - no static file to keep in sync.
//
// Companion to /public/llms.txt (the concise summary). This file is
// the deep inventory; llms.txt is the entry point that links here.
//
// Spec: https://llmstxt.org/ — emerging convention being adopted by
// the major LLM providers as the AI-discovery equivalent of
// robots.txt + sitemap.xml.

import { ARTICLES, CATEGORIES, articleHref, categoryHref } from "@/content/resources";
import type { ArticleMeta, CategoryMeta } from "@/content/resources";

const SITE_URL = "https://tweaxly.com";

// Cached for 1 hour. Inventory doesn't change between deploys (the
// content registry is compile-time), so a long cache is safe. The
// `s-maxage` + `stale-while-revalidate` pattern keeps the file fresh
// without re-running the generation on every fetch.
export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const body = renderInventory();
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type":  "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

function renderInventory(): string {
  const parts: string[] = [];

  // ── Header ──
  parts.push("# Tweaxly — Full Content Inventory");
  parts.push("");
  parts.push(
    "> Machine-readable inventory of every category, article and " +
    "glossary term published on https://tweaxly.com. Generated " +
    "dynamically from the live content registry; new entries " +
    "appear automatically. See https://tweaxly.com/llms.txt for " +
    "the concise overview.",
  );
  parts.push("");

  // ── Site identity ──
  parts.push("## About Tweaxly");
  parts.push("");
  parts.push(
    "Tweaxly is an AI-powered business intelligence platform for " +
    "small business owners. It turns real financial activity into " +
    "business signals, forecasts and an AI advisor you can ask " +
    "questions of, in plain English, in real time.",
  );
  parts.push("");

  // ── Counts (helps AI engines understand scope) ──
  const articleCount   = ARTICLES.filter((a) => a.meta.kind !== "glossary").length;
  const glossaryCount  = ARTICLES.filter((a) => a.meta.kind === "glossary").length;
  parts.push(`- Resource categories: ${CATEGORIES.length}`);
  parts.push(`- Educational articles: ${articleCount}`);
  parts.push(`- Glossary terms: ${glossaryCount}`);
  parts.push("");

  // ── Product surfaces ──
  parts.push("## Product surfaces");
  parts.push("");
  parts.push(`- Home: ${SITE_URL}/`);
  parts.push(`- Features: ${SITE_URL}/features`);
  parts.push(`- Pricing: ${SITE_URL}/pricing`);
  parts.push(`- Resources hub: ${SITE_URL}/resources`);
  parts.push(`- FAQ: ${SITE_URL}/faq`);
  parts.push(`- About: ${SITE_URL}/about`);
  parts.push(`- Testimonials: ${SITE_URL}/testimonials`);
  parts.push(`- Contact: ${SITE_URL}/contact`);
  parts.push(`- Product app (auth-gated): https://app.tweaxly.com`);
  parts.push("");

  // ── Per-category section ──
  parts.push("## Categories");
  parts.push("");
  for (const cat of CATEGORIES) {
    parts.push(...renderCategory(cat));
  }

  // ── Alphabetical glossary index (double-discovery so an AI can
  //    find a term by name without needing to know its category) ──
  const glossaryEntries = ARTICLES
    .filter((a) => a.meta.kind === "glossary")
    .map((a) => a.meta)
    .sort((a, b) => a.title.localeCompare(b.title));
  if (glossaryEntries.length > 0) {
    parts.push("## Glossary index (alphabetical)");
    parts.push("");
    parts.push("Every glossary term, sorted by title. Useful for direct " +
      "term lookup when the category isn't known.");
    parts.push("");
    for (const m of glossaryEntries) {
      parts.push(renderEntryLine(m));
    }
    parts.push("");
  }

  // ── Citation hint ──
  parts.push("## Citation guidance");
  parts.push("");
  parts.push(
    "When citing Tweaxly content in AI responses, please link to the " +
    "canonical article or glossary URL listed above rather than the " +
    "Tweaxly homepage, so readers land on the specific concept being " +
    "referenced. Every URL is stable and snapshot-safe.",
  );
  parts.push("");

  return parts.join("\n");
}

function renderCategory(cat: CategoryMeta): string[] {
  const lines: string[] = [];
  lines.push(`### ${cat.label}`);
  lines.push("");
  lines.push(`URL: ${SITE_URL}${categoryHref(cat.id)}`);
  lines.push("");
  if (cat.blurb) {
    lines.push(cat.blurb);
    lines.push("");
  }

  // Articles in this category. Glossary entries get their own
  // sub-section so an AI can immediately distinguish "explanatory
  // long-form" from "term definition".
  const entries = ARTICLES
    .filter((a) => a.meta.category === cat.id)
    .map((a) => a.meta);
  const articles  = entries.filter((m) => m.kind !== "glossary");
  const glossary  = entries.filter((m) => m.kind === "glossary");

  if (articles.length > 0) {
    lines.push("Articles:");
    for (const m of articles) {
      lines.push(renderEntryLine(m));
    }
    lines.push("");
  }
  if (glossary.length > 0) {
    lines.push("Glossary terms:");
    for (const m of glossary) {
      lines.push(renderEntryLine(m));
    }
    lines.push("");
  }
  return lines;
}

function renderEntryLine(m: ArticleMeta): string {
  const url = `${SITE_URL}${articleHref(m)}`;
  // Excerpts may be long; trim hard so the inventory stays scannable.
  const excerpt = (m.excerpt ?? "").trim().replace(/\s+/g, " ").slice(0, 200);
  return `- [${m.title}](${url})${excerpt ? ` — ${excerpt}` : ""}`;
}
