const DEFAULT_LOCAL_API = "http://localhost:4000/api/v1";
const DEFAULT_PRODUCTION_API =
  "https://serverbrokerconnect-h34t.vercel.app/api/v1";

function isExternalApiUrl(url: string) {
  return (
    /^https?:\/\//i.test(url) &&
    !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(url)
  );
}

/**
 * Browser API base URL (inlined at build time).
 *
 * - **Local `npm run dev`**: uses NEXT_PUBLIC_API_BASE_URL directly (ngrok or :4000).
 * - **Vercel production build**: uses `/api/v1` (same-origin proxy). VERCEL is NOT
 *   available in the client bundle — we detect via NODE_ENV + external API URL.
 */
function resolveApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

  // Production builds with ngrok/remote API → proxy (fixes Vercel → ngrok CORS)
  if (
    process.env.NODE_ENV === "production" &&
    configured &&
    isExternalApiUrl(configured)
  ) {
    return "/api/v1";
  }

  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    return DEFAULT_PRODUCTION_API;
  }

  return DEFAULT_LOCAL_API;
}

/** Runtime override when deployed on *.vercel.app (safety net for stale bundles). */
export function resolveApiBaseUrlAtRuntime(): string {
  if (typeof window !== "undefined" && window.location.hostname.endsWith(".vercel.app")) {
    return "/api/v1";
  }
  return appConfig.apiBaseUrl;
}

export const appConfig = {
  appName: "BrokerLoop Admin",
  productName: "BrokerLoop",
  apiBaseUrl: resolveApiBaseUrl(),
};

export const routePaths = {
  login: "/login",
  dashboard: "/dashboard",
  analytics: "/analytics",
  operations: "/operations",
  brokers: "/brokers",
  properties: "/properties",
  notifications: "/notifications",
  subscriptions: "/subscriptions",
  waitlist: "/waitlist",
  audit: "/audit",
  system: "/system",
};
