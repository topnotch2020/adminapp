export const appConfig = {
  appName: "BrokerLoop Admin",
  productName: "BrokerLoop",
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1",
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
