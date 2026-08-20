import type { NextConfig } from "next";
import path from "node:path";

const stub = path.join(__dirname, "src/lib/empty-module.ts");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    localPatterns: [
      { pathname: "/api/pay/**" },
      { pathname: "/images/**" },
      { pathname: "/image.png" },
      { pathname: "/logo.png" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "viem"],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@farcaster/mini-app-solana": stub,
    };
    return config;
  },
};

export default nextConfig;
