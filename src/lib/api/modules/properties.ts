import { api } from "@/lib/api/client";
import { unwrapEnvelope } from "@/lib/api/contracts";
import type { Property } from "@/types/domain";

type PropertiesPayload = {
  items?: Property[];
  pagination?: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
};

export const propertiesApi = {
  async list(params?: {
    limit?: number;
    skip?: number;
    status?: string;
    listingType?: "RENT" | "SALE";
    search?: string;
    brokerId?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.skip) query.set("skip", String(params.skip));
    if (params?.status) query.set("status", params.status);
    if (params?.listingType) query.set("listingType", params.listingType);
    if (params?.search) query.set("search", params.search);
    if (params?.brokerId) query.set("brokerId", params.brokerId);
    const suffix = query.toString() ? `?${query.toString()}` : "";

    const { data } = await api.get<PropertiesPayload>(`/admin/properties${suffix}`);
    return unwrapEnvelope<PropertiesPayload>(data);
  },

  async verify(propertyId: string, action: "VERIFY" | "REJECT", reason?: string) {
    const { data } = await api.patch(`/admin/properties/${propertyId}/verify`, {
      action,
      reason,
    });
    return data;
  },
};
