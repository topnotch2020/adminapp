import { api } from "@/lib/api/client";
import { unwrapEnvelope } from "@/lib/api/contracts";
import type { AuditLog, Pagination } from "@/types/domain";

type PropertyMeta = {
  propertyTypes?: string[];
  floorLevels?: string[];
  furnishing?: string[];
  listingTypes?: string[];
  propertyStatuses?: string[];
  brokerRoles?: string[];
  brokerStatuses?: string[];
};

export const systemApi = {
  async propertyMeta() {
    const { data } = await api.get<PropertyMeta | { data?: PropertyMeta }>(
      "/admin/system/meta-property"
    );
    const unwrapped = unwrapEnvelope<PropertyMeta | { data?: PropertyMeta }>(data);
    return ("data" in (unwrapped as Record<string, unknown>)
      ? (unwrapped as { data?: PropertyMeta }).data
      : unwrapped) as PropertyMeta;
  },
  async auditLogs(params?: { limit?: number; skip?: number }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.skip) query.set("skip", String(params.skip));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const { data } = await api.get<{ items?: AuditLog[]; pagination?: Pagination }>(
      `/admin/audit-logs${suffix}`
    );
    const unwrapped = unwrapEnvelope<{ items?: AuditLog[]; pagination?: Pagination }>(
      data
    );
    return { items: unwrapped.items ?? [], pagination: unwrapped.pagination };
  },
};
