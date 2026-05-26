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
};

export default nextConfig;
