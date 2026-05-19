import { api } from "@/lib/api/client";
import { unwrapEnvelope } from "@/lib/api/contracts";
import type { AnalyticsOverview } from "@/types/domain";

export const analyticsApi = {
  async overview(days = 14) {
    const { data } = await api.get<AnalyticsOverview>(
      `/admin/analytics/overview?days=${days}`
    );
    return unwrapEnvelope<AnalyticsOverview>(data);
  },
};
