import { api } from "@/lib/api/client";
import { unwrapEnvelope } from "@/lib/api/contracts";
import type { AuthUser, LoginPayload } from "@/types/domain";

export const authApi = {
  async login(payload: LoginPayload) {
    const { data } = await api.post<{ token: string }>("/auth/login", payload);
    const unwrapped = unwrapEnvelope<{ token: string }>(data);
    return unwrapped.token;
  },
  async me() {
    const { data } = await api.get<AuthUser>("/auth/me");
    return unwrapEnvelope<AuthUser>(data);
  },
  async logout() {
    await api.post("/auth/logout");
  },
};
