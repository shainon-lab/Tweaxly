/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "20mb" },
    serverComponentsExternalPackages: ["xlsx", "@prisma/client", "bcryptjs", "pdf-parse"],
  },
};

module.exports = nextConfig;
