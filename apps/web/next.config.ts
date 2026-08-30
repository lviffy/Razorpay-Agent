import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@zapai/database", "@zapai/types"],
  serverExternalPackages: ["pg"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "https://razorpay-agent-production.up.railway.app";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: "/demo/:path*",
        destination: `${backendUrl}/demo/:path*`,
      },
    ];
  },
};

export default nextConfig;
