import { api } from "@/lib/api/client";
import { unwrapEnvelope } from "@/lib/api/contracts";

export type AddressAreaRecord = {
  id: string;
  name: string;
  region: string;
};

export const addressAreasApi = {
  async list() {
    const { data } = await api.get<{ data?: { items?: AddressAreaRecord[] } }>(
      "/admin/address-areas"
    );
    const unwrapped = unwrapEnvelope<{ data?: { items?: AddressAreaRecord[] } }>(data);
    const payload =
      unwrapped && typeof unwrapped === "object" && "data" in unwrapped
        ? (unwrapped as { data?: { items?: AddressAreaRecord[] } }).data
        : (unwrapped as { items?: AddressAreaRecord[] });
    return payload?.items ?? [];
  },

  async create(payload: { name: string; region?: string }) {
    const { data } = await api.post<{ data?: { item?: AddressAreaRecord } }>(
      "/admin/address-areas",
      payload
    );
    const unwrapped = unwrapEnvelope<{ data?: { item?: AddressAreaRecord } }>(data);
    const item =
      unwrapped && typeof unwrapped === "object" && "data" in unwrapped
        ? (unwrapped as { data?: { item?: AddressAreaRecord } }).data?.item
        : (unwrapped as { item?: AddressAreaRecord }).item;
    return item;
  },

  async remove(id: string) {
    await api.delete(`/admin/address-areas/${id}`);
  },
};
