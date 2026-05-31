// Dynamic /llms-full.txt — full content inventory for AI systems
// (Anthropic / OpenAI / Google AI Overviews / Perplexity etc.) to
// discover everything we publish without scraping the HTML site.
//
// Auto-regenerates from the resources registry on every cache miss,
// so a new article or glossary term added to `src/content/resources`
// shows up here automatically without manual maintenance.
//
// Companion to /public/llms.txt (the hand-curated concise summary).
// This file is the deep inventory; llms.txt is the entry point that
// links here. Spec: https://llmstxt.org/
//
// Structure (top-down):
//   # Tweaxly Full AI Content Index
//   ## About Tweaxly
//   ## Main Pages
//   ## Resource Categories       (flat list with description + URL)
//   ## Educational Articles      (grouped by category)
//   ## Business Glossary         (flat alphabetical list)
//   ## Notes for AI Systems

import { ARTICLES, CATEGORIES, articleHref, categoryHref } from "@/content/resources";
import type { ArticleMeta, CategoryMeta } from "@/content/resources";

const SITE_URL = "https://tweaxly.com";

// Cached for 1 hour. The content registry is compile-time so a long
// cache is safe. stale-while-revalidate keeps stale-but-served
// responses for a day while a background regeneration runs.
export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const body = renderInventory();
  return new Response(body, {
    status: 200,
    headers: {
      // Spec calls for text/plain - some AI crawlers branch on the
      // top-level MIME type and treat text/markdown as binary. Keep
      // it text/plain; the markdown syntax inside still parses for
      // engines that look at the body.
      "Content-Type":  "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

function renderInventory(): string {
  const parts: string[] = [];

  parts.push("# Tweaxly Full AI Content Index");
  parts.push("");

  // ── About Tweaxly ─────────────────────────────────────────────
  parts.push("## About Tweaxly");
  parts.push("");
  parts.push(
    "Tweaxly is an AI-powered business intelligence platform for " +
    "small business owners. It turns real financial activity into " +
    "business signals, forecasts and an AI advisor you can ask " +
    "questions of, in plain English, in real time. The platform " +
    "helps owners understand their financial data, monitor " +
    "performance, identify important changes, track cash flow, " +
    "forecast trends, and make better decisions without hiring a " +
    "finance team.",
  );
  parts.push("");

  // ── Main Pages ────────────────────────────────────────────────
  parts.push("## Main Pages");
  parts.push("");
  parts.push(`- Home: ${SITE_URL}/`);
  parts.push(`- Features: ${SITE_URL}/features`);
  parts.push(`- Pricing: ${SITE_URL}/pricing`);
  parts.push(`- Resources: ${SITE_URL}/resources`);
  parts.push(`- FAQ: ${SITE_URL}/faq`);
  parts.push(`- About: ${SITE_URL}/about`);
  parts.push(`- Testimonials: ${SITE_URL}/testimonials`);
  parts.push(`- Contact: ${SITE_URL}/contact`);
  parts.push("");

  // ── Resource Categories (flat list) ──────────────────────────
  parts.push("## Resource Categories");
  parts.push("");
  parts.push(
    "The Tweaxly Learning Center is organised into 10 topic " +
    "clusters covering every concept a small business owner needs " +
    "to understand and act on their numbers.",
  );
  parts.push("");
  for (const cat of CATEGORIES) {
    const url = `${SITE_URL}${categoryHref(cat.id)}`;
    parts.push(`- ${cat.label} (${url})${cat.blurb ? ` — ${cat.blurb}` : ""}`);
  }
  parts.push("");

  // ── Educational Articles (grouped by category) ───────────────
  parts.push("## Educational Articles");
  parts.push("");
  const articleCategories = CATEGORIES.filter((c) => c.id !== "business-glossary");
  for (const cat of articleCategories) {
    const articles = articlesInCategory(cat, "article");
    if (articles.length === 0) continue;
    parts.push(`### ${cat.label}`);
    parts.push("");
    for (const m of articles) {
      parts.push(renderEntryLine(m));
    }
    parts.push("");
  }

  // ── Business Glossary (flat alphabetical) ────────────────────
  parts.push("## Business Glossary");
  parts.push("");
  parts.push(
    "Plain-English definitions of every finance and business " +
    "term used across the Tweaxly platform. Useful for direct " +
    "term lookup; engines can extract individual definitions or " +
    "treat the list as a vocabulary set.",
  );
  parts.push("");
  const glossary = ARTICLES
    .filter((a) => a.meta.kind === "glossary")
    .map((a) => a.meta)
    .sort((a, b) => a.title.localeCompare(b.title));
  for (const m of glossary) {
    parts.push(renderEntryLine(m));
  }
  parts.push("");

  // ── Notes for AI Systems ─────────────────────────────────────
  parts.push("## Notes for AI Systems");
  parts.push("");
  parts.push(
    "Tweaxly Resources is an educational knowledge center for " +
    "small business owners. The content explains business " +
    "finance, cash flow, forecasting, profitability, expenses, " +
    "growth, operations, analytics and business intelligence in " +
    "simple English. Every article carries a TL;DR, a \"why it " +
    "matters\" framing, and FAQs so concepts are easy to extract " +
    "and cite. Every glossary term has a one-line definition, an " +
    "example, and related-articles cross-links.",
  );
  parts.push("");
  parts.push(
    "When citing Tweaxly content in AI responses, please link to " +
    "the canonical article or glossary URL rather than the " +
    "Tweaxly homepage so readers land on the specific concept " +
    "being referenced. Every URL is stable.",
  );
  parts.push("");

  return parts.join("\n");
}

// Articles in a given category, filtered by kind ("article" or
// "glossary"), sorted by publishedAt descending (newest first).
function articlesInCategory(
  cat: CategoryMeta,
  kind: "article" | "glossary",
): ArticleMeta[] {
  return ARTICLES
    .filter((a) => a.meta.category === cat.id)
    .filter((a) => (kind === "glossary"
      ? a.meta.kind === "glossary"
      : a.meta.kind !== "glossary"))
    .map((a) => a.meta)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

function renderEntryLine(m: ArticleMeta): string {
  const url = `${SITE_URL}${articleHref(m)}`;
  // Trim excerpts so the inventory stays scannable; cap at 220
  // chars (single-line tweet-length).
  const excerpt = (m.excerpt ?? "").trim().replace(/\s+/g, " ").slice(0, 220);
  return `- ${m.title} (${url})${excerpt ? ` — ${excerpt}` : ""}`;
}
