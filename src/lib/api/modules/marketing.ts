import { api } from "@/lib/api/client";

export const marketingApi = {
  async joinWaitlist(payload: { name: string; email: string; phone?: string }) {
    const { data } = await api.post("/admin/integrations/waitlist", {
      email: payload.email,
      source: "adminapp",
      metadata: {
        name: payload.name,
        phone: payload.phone,
      },
    });
    return data;
  },
};
