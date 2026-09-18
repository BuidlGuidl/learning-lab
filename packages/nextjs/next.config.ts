import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  async redirects() {
    return [{ source: "/labs/deploy-crowdfund", destination: "/labs/crowdfunding", permanent: true }];
  },
  async rewrites() {
    // Keep the existing lab ID so saved progress survives the public URL change.
    return [{ source: "/labs/crowdfunding", destination: "/labs/deploy-crowdfund" }];
  },
  typescript: {
    ignoreBuildErrors: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
};

const isIpfs = process.env.NEXT_PUBLIC_IPFS_BUILD === "true";

if (isIpfs) {
  nextConfig.output = "export";
  nextConfig.trailingSlash = true;
  nextConfig.images = {
    unoptimized: true,
  };
}

module.exports = nextConfig;
