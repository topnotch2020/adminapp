const DEFAULT_LOCAL_API = "http://localhost:4000/api/v1";
const DEFAULT_PRODUCTION_API =
  "https://gurglingly-cichoriaceous-freida.ngrok-free.dev/api/v1";

/**
 * Resolves the API base URL for axios.
 * - Explicit NEXT_PUBLIC_API_BASE_URL always wins.
 * - On Vercel, default to same-origin `/api/v1` (proxied via next.config rewrites).
 * - Local dev falls back to localhost.
 */
function resolveApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (configured) return configured;

  if (process.env.VERCEL === "1") {
    return "/api/v1";
  }

  if (process.env.NODE_ENV === "production") {
    return DEFAULT_PRODUCTION_API;
  }

  return DEFAULT_LOCAL_API;
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
