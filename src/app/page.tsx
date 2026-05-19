"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { routePaths } from "@/lib/config";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(isAuthenticated ? routePaths.dashboard : routePaths.login);
  }, [isAuthenticated, loading, router]);

  return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
}
