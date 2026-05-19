"use client";

import { authApi } from "@/lib/api/modules/auth";
import { authStorage } from "@/lib/auth-storage";
import type { AuthUser } from "@/types/domain";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthContextShape = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextShape | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const init = async () => {
      const token = authStorage.getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await authApi.me();
        setUser(me);
      } catch {
        authStorage.clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [loading, pathname, router, user]);

  const value = useMemo<AuthContextShape>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login: async (token: string) => {
        authStorage.setToken(token);
        const me = await authApi.me();
        setUser(me);
      },
      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // noop
        } finally {
          authStorage.clearToken();
          setUser(null);
          router.replace("/login");
        }
      },
    }),
    [loading, router, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
