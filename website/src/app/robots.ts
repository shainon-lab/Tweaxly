// Next.js native robots.txt. Exposed at /robots.txt and references
// the XML sitemap so crawlers can discover every page + article.
//
// AI discovery layer: in addition to the standard sitemap, the site
// publishes /llms.txt (concise summary) and /llms-full.txt (full
// machine-readable inventory of categories + articles + glossary).
// Per the llmstxt.org convention these files are discovered at
// fixed URLs - they do NOT belong in the robots.txt Sitemap field
// (Sitemap: is reserved for XML sitemaps). Well-behaved AI crawlers
// look for /llms.txt directly by convention.

import type { MetadataRoute } from "next";

const SITE_URL = "https://tweaxly.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Internal API routes don't belong in search results.
        // /resources, /llms.txt and /llms-full.txt are intentionally
        // crawlable - they're the AI-discovery layer.
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
