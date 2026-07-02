import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from the backend
  images: {
    domains: ["localhost"],
  },
  // Proxy /api calls to FastAPI backend in development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
