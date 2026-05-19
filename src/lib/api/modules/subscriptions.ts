import { api } from "@/lib/api/client";
import { unwrapEnvelope } from "@/lib/api/contracts";

export type SubscriptionSnapshot = {
  brokerId?: string;
  brokerName?: string;
  email?: string;
  planName: string;
  usedSlots: number;
  usedRentSlots: number;
  usedSaleSlots: number;
  rentSlots: number;
  saleSlots: number;
  totalSlots: number;
  remainingSlots: number;
  remainingRentSlots: number;
  remainingSaleSlots: number;
};

export const subscriptionsApi = {
  async list(): Promise<SubscriptionSnapshot[]> {
    const { data } = await api.get<{ items?: SubscriptionSnapshot[] }>("/admin/subscriptions");
    const unwrapped = unwrapEnvelope<{ items?: SubscriptionSnapshot[] }>(data);
    return unwrapped.items ?? [];
  },

  async update(
    brokerId: string,
    payload: { rentSlots: number; saleSlots: number; planName?: string }
  ): Promise<SubscriptionSnapshot> {
    const { data } = await api.patch<{ data?: SubscriptionSnapshot }>(
      `/admin/subscriptions/${brokerId}`,
      payload
    );
    const unwrapped = unwrapEnvelope<{ data?: SubscriptionSnapshot }>(data);
    return unwrapped.data ?? (unwrapped as unknown as SubscriptionSnapshot);
  },
};
