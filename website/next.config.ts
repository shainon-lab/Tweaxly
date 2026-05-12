import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this folder so Next doesn't get confused by the
  // sibling /Users/shai-mac/ai-cfo-mvp/package-lock.json above us.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
