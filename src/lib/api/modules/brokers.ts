import { api } from "@/lib/api/client";
import { unwrapEnvelope } from "@/lib/api/contracts";
import type { Broker, DashboardMetrics, Pagination } from "@/types/domain";

type BrokerListResponse =
  | {
      items?: Broker[];
      pagination?: Pagination;
      success?: boolean;
    };

export const brokersApi = {
  async list(params?: {
    limit?: number;
    skip?: number;
    search?: string;
    role?: "BROKER" | "ADMIN";
    status?: "PENDING_VERIFICATION" | "VERIFIED" | "SUSPENDED" | "BLOCKED";
  }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.skip) query.set("skip", String(params.skip));
    if (params?.search) query.set("search", params.search);
    if (params?.role) query.set("role", params.role);
    if (params?.status) query.set("status", params.status);
    const suffix = query.toString() ? `?${query.toString()}` : "";

    const { data } = await api.get<BrokerListResponse>(`/admin/brokers${suffix}`);
    const unwrapped = unwrapEnvelope<BrokerListResponse>(data);
    return { items: unwrapped.items ?? [], pagination: unwrapped.pagination };
  },
  async updateRole(brokerId: string, role: "BROKER" | "ADMIN") {
    const { data } = await api.patch<{ data?: Broker }>(
      `/admin/brokers/${brokerId}/role`,
      { role }
    );
    const unwrapped = unwrapEnvelope<{ data?: Broker }>(data);
    return unwrapped.data ?? (unwrapped as unknown as Broker);
  },
  async updateStatus(
    brokerId: string,
    status: "PENDING_VERIFICATION" | "VERIFIED" | "SUSPENDED" | "BLOCKED"
  ) {
    const { data } = await api.patch<{ data?: Broker }>(
      `/admin/brokers/${brokerId}/status`,
      { status }
    );
    const unwrapped = unwrapEnvelope<{ data?: Broker }>(data);
    return unwrapped.data ?? (unwrapped as unknown as Broker);
  },
  async dashboardMetrics() {
    const { data } = await api.get<DashboardMetrics>("/admin/dashboard/metrics");
    return unwrapEnvelope<DashboardMetrics>(data);
  },
  async createAdmin(
    payload: {
      fname: string;
      lname: string;
      email: string;
      phone?: string;
      dob?: string;
      password: string;
    },
    bootstrapSecret: string
  ) {
    const { data } = await api.post("/admin/create", payload, {
      headers: { "x-admin-secret": bootstrapSecret },
    });
    return data;
  },
};
