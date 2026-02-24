import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict mode helps catch bugs early
  reactStrictMode: true,

  // Optimize production builds
  poweredByHeader: false,

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
