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

export type AdminPropertyAction =
  | "VERIFY"
  | "REJECT"
  | "EXPIRE"
  | "MARK_SOLD"
  | "EXTEND"
  | "SOFT_DELETE"
  | "RESTORE";

export type PropertyStats = {
  total: number;
  unverified: number;
  verified: number;
  expired: number;
  sold: number;
  expiringSoon: number;
  rentActive: number;
  saleActive: number;
  listingExpiryDays: { RENT: number; SALE: number };
};

export const propertiesApi = {
  async list(params?: {
    limit?: number;
    skip?: number;
    status?: string;
    listingType?: "RENT" | "SALE";
    search?: string;
    brokerId?: string;
    expiringSoon?: boolean;
  }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.skip) query.set("skip", String(params.skip));
    if (params?.status) query.set("status", params.status);
    if (params?.listingType) query.set("listingType", params.listingType);
    if (params?.search) query.set("search", params.search);
    if (params?.brokerId) query.set("brokerId", params.brokerId);
    if (params?.expiringSoon) query.set("expiringSoon", "true");
    const suffix = query.toString() ? `?${query.toString()}` : "";

    const { data } = await api.get<PropertiesPayload>(`/admin/properties${suffix}`);
    return unwrapEnvelope<PropertiesPayload>(data);
  },

  async stats() {
    const { data } = await api.get<{ data?: PropertyStats }>("/admin/properties/stats");
    return unwrapEnvelope<PropertyStats>(data);
  },

  async verify(propertyId: string, action: "VERIFY" | "REJECT", reason?: string) {
    const { data } = await api.patch(`/admin/properties/${propertyId}/verify`, {
      action,
      reason,
    });
    return data;
  },

  async manage(
    propertyId: string,
    action: AdminPropertyAction,
    options?: { reason?: string; expiresAt?: string; extensionDays?: number }
  ) {
    const { data } = await api.patch(`/admin/properties/${propertyId}/manage`, {
      action,
      ...options,
    });
    return data;
  },
};
