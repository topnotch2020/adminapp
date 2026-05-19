const DEFAULT_LOCAL_API = "http://localhost:4000/api/v1";

function resolveApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (configured) {
    return configured;
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
