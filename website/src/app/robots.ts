// Next.js native robots.txt. Exposed at /robots.txt and references
// the sitemap so crawlers can discover every page + article.
//
// AI discovery layer: in addition to the standard sitemap, the site
// publishes /llms.txt (concise summary) and /llms-full.txt (full
// machine-readable inventory of categories + articles + glossary).
// Per the emerging llmstxt.org convention these files are NOT yet
// part of the robots.txt spec - they're discovered via convention -
// but we surface them in the host-level Sitemap field as additional
// pointers so crawlers that already scan /robots.txt also get the
// hint without doing a separate fetch.

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
    // Multiple sitemap URLs are supported by the robots.txt spec
    // (https://www.sitemaps.org/protocol.html#submit_robots). We
    // also surface the llms.* discovery files so well-behaved
    // crawlers see the AI-friendly inventory without a separate
    // request to /llms.txt.
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/llms.txt`,
      `${SITE_URL}/llms-full.txt`,
    ],
    host: SITE_URL,
  };
}
