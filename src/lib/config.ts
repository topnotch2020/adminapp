export const appConfig = {
  appName: "AdminApp",
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1",
};

export const routePaths = {
  login: "/login",
  dashboard: "/dashboard",
  operations: "/operations",
  brokers: "/brokers",
  properties: "/properties",
  notifications: "/notifications",
  subscriptions: "/subscriptions",
  audit: "/audit",
  system: "/system",
};
