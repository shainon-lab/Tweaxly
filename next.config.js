/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "20mb" },
    serverComponentsExternalPackages: ["xlsx", "@prisma/client", "bcryptjs"],
  },
};

module.exports = nextConfig;
