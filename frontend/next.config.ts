import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // NOTE: Do NOT use output: 'export' — that disables API routes (needed for AI features)
  images: {
    unoptimized: true
  },
  output: 'standalone',
  transpilePackages: ['forgecad'],
  serverExternalPackages: ['manifold-3d'],
};

export default nextConfig;
