import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin BOTH the turbopack root AND the file-tracing root to this folder.
  // Reason: there's a sibling /Users/shai-mac/ai-cfo-mvp/package-lock.json
  // for the app project above this directory. Without these pins, Next 16
  // walks up looking for a lockfile, lands on the app's, and then treats
  // the app code (including its src/middleware.ts which references
  // iron-session + Prisma) as part of this build. The result is a build
  // failure on Vercel because those modules aren't installed here.
  //
  // On Vercel, the platform auto-injects outputFileTracingRoot pointing
  // at the cloned-repo root (/vercel/path0). Setting it explicitly here
  // overrides that and stops Vercel's value from pulling in the parent.
  outputFileTracingRoot: __dirname,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
