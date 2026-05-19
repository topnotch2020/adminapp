import type { NextConfig } from "next";

const apiProxyTarget = (
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://serverbrokerconnect-h34t.vercel.app/api/v1"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Fallback proxy; primary proxy is src/app/api/v1/[...path]/route.ts (runtime env + ngrok headers)
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
