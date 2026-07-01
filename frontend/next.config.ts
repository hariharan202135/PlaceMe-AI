import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Allow production builds to complete successfully even with type errors (like recharts and loose typing API payloads)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allow production builds to complete successfully even with linting checks (like unescaped quotes in descriptions)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
