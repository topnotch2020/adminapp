import { api } from "@/lib/api/client";
import { unwrapEnvelope } from "@/lib/api/contracts";

export type AddressAreaItem = {
  name: string;
  region: string;
};

export type AddressAreaGroup = {
  region: string;
  areas: string[];
};

type AddressAreasPayload = {
  address?: { area?: AddressAreaGroup[] };
  items?: AddressAreaItem[];
};

export const metaApi = {
  async searchAreas(query = "", limit = 20) {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    params.set("limit", String(limit));
    const suffix = params.toString() ? `?${params.toString()}` : "";
    const { data } = await api.get<{ data?: AddressAreasPayload } | AddressAreasPayload>(
      `/meta/address/areas${suffix}`
    );
    const unwrapped = unwrapEnvelope<{ data?: AddressAreasPayload } | AddressAreasPayload>(data);
    const payload =
      unwrapped && typeof unwrapped === "object" && "data" in unwrapped
        ? (unwrapped as { data?: AddressAreasPayload }).data
        : (unwrapped as AddressAreasPayload);
    return {
      groups: payload?.address?.area ?? [],
      items: payload?.items ?? [],
    };
  },
};
