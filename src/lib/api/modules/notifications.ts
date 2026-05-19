import { api } from "@/lib/api/client";
import { unwrapEnvelope } from "@/lib/api/contracts";
import type { DashboardMetrics, Notification, Pagination } from "@/types/domain";

export const notificationsApi = {
  async list(params?: { limit?: number; skip?: number }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.skip) query.set("skip", String(params.skip));
    const suffix = query.toString() ? `?${query.toString()}` : "";

    const { data } = await api.get<
      { items?: Notification[]; pagination?: Pagination }
    >(
      `/admin/notifications${suffix}`
    );
    const unwrapped = unwrapEnvelope<{ items?: Notification[]; pagination?: Pagination }>(data);
    return { items: unwrapped.items ?? [], pagination: unwrapped.pagination };
  },
  async unreadCount() {
    const { data } = await api.get<DashboardMetrics>(
      "/admin/dashboard/metrics"
    );
    const unwrapped = unwrapEnvelope<DashboardMetrics>(data);
    return unwrapped.notificationsUnread ?? 0;
  },
};
