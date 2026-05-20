// Shape every Resources article exports. Body is a React component so
// each piece can use the article primitives (Callout, Quote,
// ProductCta) directly in JSX without an MDX toolchain.

import type { ComponentType } from "react";

export type CategoryId =
  | "forecasting"
  | "cash-flow"
  | "business-signals"
  | "financial-planning"
  | "ai-finance";

export interface CategoryMeta {
  id:    CategoryId;
  label: string;
  blurb: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "ai-finance",         label: "AI Finance",         blurb: "AI financial advisors, AI CFOs, the new financial intelligence stack." },
  { id: "forecasting",        label: "Forecasting",        blurb: "Revenue, expense, and scenario forecasting for growing businesses." },
  { id: "cash-flow",          label: "Cash Flow",          blurb: "Cash flow forecasting, runway, and liquidity intelligence." },
  { id: "business-signals",   label: "Business Signals",   blurb: "Real-time detection of risks, opportunities, and anomalies in your numbers." },
  { id: "financial-planning", label: "Financial Planning", blurb: "Modern financial planning practices for SMB owners and founders." },
];

export interface ArticleMeta {
  slug:        string;                   // url segment
  title:       string;                   // H1
  excerpt:     string;                   // ~160 chars
  category:    CategoryId;
  tags:        string[];                 // surfaced as chips on the card
  author:      { name: string; role: string };
  publishedAt: string;                   // YYYY-MM-DD
  readingTime: number;                   // minutes
  featured?:   boolean;
  seo: {
    title:       string;
    description: string;
    keywords:    string[];
  };
}

export interface ArticleModule {
  meta: ArticleMeta;
  Body: ComponentType;
}
