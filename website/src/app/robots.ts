// Next.js native robots.txt. Exposed at /robots.txt and references
// the sitemap so crawlers can discover every page + article.

import type { MetadataRoute } from "next";

const SITE_URL = "https://tweaxly.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Internal API routes don't belong in search results.
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
