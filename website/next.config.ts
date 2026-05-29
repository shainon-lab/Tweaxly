import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this folder so Next doesn't get confused by the
  // sibling /Users/shai-mac/ai-cfo-mvp/package-lock.json above us when running
  // dev locally. On Vercel, the "Include files outside the root directory"
  // toggle in Project Settings handles the same scope problem - so we don't
  // need outputFileTracingRoot here (setting it explicitly seems to confuse
  // Vercel's routes-manifest-deterministic step).
  turbopack: {
    root: __dirname,
  },
  // Legacy Resources URLs. The Learning Center moved from a flat
  // /resources/<slug> layout to nested /resources/<category>/<slug>
  // so each article lives under its topical category. Existing
  // inbound links (organic, social, email) keep working via 301
  // redirects so we preserve every dollar of SEO equity already
  // accrued to the old URLs.
  async redirects() {
    return [
      {
        source:      "/resources/what-is-ai-financial-advisor",
        destination: "/resources/business-intelligence/what-is-ai-financial-advisor",
        permanent:   true,
      },
      {
        source:      "/resources/cash-flow-problems-early-warning",
        destination: "/resources/cash-flow-management/cash-flow-problems-early-warning",
        permanent:   true,
      },
      {
        source:      "/resources/financial-forecasting-small-business-guide",
        destination: "/resources/business-forecasting/financial-forecasting-small-business-guide",
        permanent:   true,
      },
      {
        source:      "/resources/business-signals-founders-monitor",
        destination: "/resources/business-signals/business-signals-founders-monitor",
        permanent:   true,
      },
      {
        source:      "/resources/spreadsheets-not-enough",
        destination: "/resources/business-intelligence/spreadsheets-not-enough",
        permanent:   true,
      },
    ];
  },
};

export default nextConfig;
