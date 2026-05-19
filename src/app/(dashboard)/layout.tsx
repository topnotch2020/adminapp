"use client";

import { CommandPalette } from "@/components/layout/command-palette";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useAuth } from "@/components/providers/auth-provider";
import { MetricsProvider } from "@/components/providers/metrics-provider";
import { routePaths } from "@/lib/config";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const titleMap: Record<string, string> = {
  [routePaths.dashboard]: "Dashboard",
  [routePaths.analytics]: "Analytics",
  [routePaths.operations]: "Operations Center",
  [routePaths.brokers]: "Brokers",
  [routePaths.properties]: "Properties",
  [routePaths.subscriptions]: "Subscriptions",
  [routePaths.notifications]: "Notifications",
  [routePaths.waitlist]: "Waitlist",
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
        <div className="panel px-6 py-4 text-sm muted">Loading admin console...</div>
      </div>
    );
  }

  const title = titleMap[pathname] || "Dashboard";

  return (
    <MetricsProvider>
      <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar title={title} />
          <main className="flex-1 overflow-auto p-6">
            <div className="mx-auto w-full max-w-[1440px]">{children}</div>
          </main>
        </div>
        <CommandPalette />
      </div>
    </MetricsProvider>
  );
}
