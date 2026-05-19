import type { AuthUser } from "@/types/domain";

export const ADMIN_ROLE = "ADMIN";

export function normalizeAuthUser(raw: Record<string, unknown>): AuthUser {
  return {
    _id: String(raw._id ?? raw.id ?? ""),
    fname: String(raw.fname ?? ""),
    lname: String(raw.lname ?? ""),
    email: String(raw.email ?? ""),
    phone: raw.phone ? String(raw.phone) : undefined,
    role: raw.role ? String(raw.role) : undefined,
  };
}

export function isAdminUser(user: AuthUser | null | undefined): boolean {
  return user?.role === ADMIN_ROLE;
}

export class AdminAccessError extends Error {
  constructor() {
    super("Admin access required. Broker accounts cannot use this console.");
    this.name = "AdminAccessError";
  }
}

export function assertAdminUser(user: AuthUser): void {
  if (!isAdminUser(user)) {
    throw new AdminAccessError();
  }
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string }; status?: number } })
      .response;
    if (response?.status === 403) {
      return "Admin access required. Sign in with an admin account.";
    }
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
