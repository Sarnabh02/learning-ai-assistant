import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep webpack config for non-Turbopack builds
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
  // Turbopack config (Next.js 16 default) — canvas alias not needed for text-only PDF parsing
  turbopack: {},
};

export default nextConfig;
