import { api } from "@/lib/api/client";
import { unwrapEnvelope } from "@/lib/api/contracts";
import type { Pagination, WaitlistEntry } from "@/types/domain";

type WaitlistListResponse = {
  items?: WaitlistEntry[];
  pagination?: Pagination;
};

export const waitlistApi = {
  async list(params?: { limit?: number; skip?: number; search?: string }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.skip) query.set("skip", String(params.skip));
    if (params?.search) query.set("search", params.search);
    const suffix = query.toString() ? `?${query.toString()}` : "";

    const { data } = await api.get<WaitlistListResponse>(
      `/admin/integrations/waitlist${suffix}`
    );
    const unwrapped = unwrapEnvelope<WaitlistListResponse>(data);
    return {
      items: unwrapped.items ?? [],
      pagination: unwrapped.pagination,
    };
  },
  async add(payload: { email: string; source?: string; metadata?: Record<string, unknown> }) {
    const { data } = await api.post("/admin/integrations/waitlist", payload);
    return unwrapEnvelope(data);
  },
};
