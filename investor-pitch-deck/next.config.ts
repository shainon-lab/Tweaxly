import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this folder so Next doesn't pick up the parent
  // lockfile and emit "multiple lockfiles" warnings at startup.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
