import { api } from "@/lib/api/client";
import { assertAdminUser, normalizeAuthUser } from "@/lib/admin-auth";
import { unwrapEnvelope } from "@/lib/api/contracts";
import type { AuthUser, LoginPayload } from "@/types/domain";

export const authApi = {
  async login(payload: LoginPayload) {
    const { data } = await api.post<{ token: string }>("/auth/login", payload);
    const unwrapped = unwrapEnvelope<{ token: string }>(data);
    return unwrapped.token;
  },
  async me(): Promise<AuthUser> {
    const { data } = await api.get<AuthUser>("/auth/me");
    const user = normalizeAuthUser(
      unwrapEnvelope<Record<string, unknown>>(data as Record<string, unknown>)
    );
    assertAdminUser(user);
    return user;
  },
  async logout() {
    await api.post("/auth/logout");
  },
};
