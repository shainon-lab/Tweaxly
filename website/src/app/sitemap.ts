// Next.js native sitemap. Exposed at /sitemap.xml at build time;
// gets re-generated on every deploy so newly-added articles show up
// automatically (the resources registry is the source of truth).
//
// Submit to Google Search Console as: https://tweaxly.com/sitemap.xml

import type { MetadataRoute } from "next";
import { ARTICLES } from "@/content/resources";
import { SUBPAGES as FEATURE_SUBPAGES } from "@/content/features";

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
    url:            `${SITE_URL}/resources/${a.meta.slug}`,
    // Articles use their own published date so Google can see how
    // fresh each one is - sitemap-level signal that matters for
    // ranking of evergreen content.
    lastModified:    new Date(a.meta.publishedAt),
    changeFrequency: "monthly",
    priority:        0.7,
  }));

  // Per-feature deep-dive pages - high-priority product surface.
  const featureSubpageEntries: MetadataRoute.Sitemap = FEATURE_SUBPAGES.map((sp) => ({
    url:            `${SITE_URL}/features/${sp.slug}`,
    lastModified:   now,
    changeFrequency: "monthly",
    priority:        0.85,
  }));

  return [...staticEntries, ...articleEntries, ...featureSubpageEntries];
}
