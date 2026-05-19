"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { routePaths } from "@/lib/config";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const titleMap: Record<string, string> = {
  [routePaths.dashboard]: "Dashboard",
  [routePaths.operations]: "Operations",
  [routePaths.brokers]: "Brokers",
  [routePaths.properties]: "Properties",
  [routePaths.subscriptions]: "Subscriptions",
  [routePaths.notifications]: "Notifications",
  [routePaths.audit]: "Audit Logs",
  [routePaths.system]: "System",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(routePaths.login);
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading dashboard...
      </div>
    );
  }

  const title = titleMap[pathname] || "Dashboard";

  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar title={title} />
        <main className="flex-1 p-6">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
