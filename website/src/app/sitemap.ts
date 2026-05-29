// Next.js native sitemap. Exposed at /sitemap.xml at build time;
// gets re-generated on every deploy so newly-added articles show up
// automatically (the resources registry is the source of truth).
//
// Submit to Google Search Console as: https://tweaxly.com/sitemap.xml

import type { MetadataRoute } from "next";
import { ARTICLES, CATEGORIES, articleHref, categoryHref } from "@/content/resources";
import { SUBPAGES as FEATURE_SUBPAGES } from "@/content/features";
import { COMPARISONS } from "@/content/comparisons";

const SITE_URL = "https://tweaxly.com";

// Static marketing routes. Listed explicitly so the priorities and
// change frequencies can be tuned individually (high-traffic landing
// pages get a higher priority hint than legal pages).
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/",              priority: 1.0, changeFrequency: "weekly"  },
  { path: "/about",         priority: 0.8, changeFrequency: "monthly" },
  { path: "/features",      priority: 0.95, changeFrequency: "weekly" },
  { path: "/pricing",       priority: 0.9, changeFrequency: "weekly"  },
  { path: "/resources",     priority: 0.9, changeFrequency: "weekly"  },
  { path: "/faq",           priority: 0.7, changeFrequency: "monthly" },
  { path: "/testimonials",  priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact",       priority: 0.6, changeFrequency: "monthly" },
  { path: "/privacy",       priority: 0.3, changeFrequency: "yearly"  },
  { path: "/terms",         priority: 0.3, changeFrequency: "yearly"  },
  { path: "/accessibility", priority: 0.3, changeFrequency: "yearly"  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url:            `${SITE_URL}${r.path}`,
    lastModified:   now,
    changeFrequency: r.changeFrequency,
    priority:        r.priority,
  }));

  const articleEntries: MetadataRoute.Sitemap = ARTICLES.map((a) => ({
    url:            `${SITE_URL}${articleHref(a.meta)}`,
    // Articles use their own published date so Google can see how
    // fresh each one is - sitemap-level signal that matters for
    // ranking of evergreen content.
    lastModified:    new Date(a.meta.updatedAt ?? a.meta.publishedAt),
    changeFrequency: "monthly",
    priority:        0.7,
  }));

  // Every Learning Center category gets its own sitemap entry so the
  // category landing pages get crawled and indexed independently of
  // the articles inside them.
  const categoryEntries: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url:            `${SITE_URL}${categoryHref(c.id)}`,
    lastModified:   now,
    changeFrequency: "weekly",
    priority:        0.85,
  }));

  // Per-feature deep-dive pages - high-priority product surface.
  const featureSubpageEntries: MetadataRoute.Sitemap = FEATURE_SUBPAGES.map((sp) => ({
    url:            `${SITE_URL}/features/${sp.slug}`,
    lastModified:   now,
    changeFrequency: "monthly",
    priority:        0.85,
  }));

  // Comparison pages - high GEO value (AI engines cite "X vs Y"
  // queries heavily). Priority equivalent to feature subpages.
  const comparisonEntries: MetadataRoute.Sitemap = COMPARISONS.map((c) => ({
    url:            `${SITE_URL}/compare/${c.slug}`,
    lastModified:   now,
    changeFrequency: "monthly",
    priority:        0.85,
  }));

  return [
    ...staticEntries,
    ...categoryEntries,
    ...articleEntries,
    ...featureSubpageEntries,
    ...comparisonEntries,
  ];
}
