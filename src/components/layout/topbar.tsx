"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useMetrics } from "@/components/providers/metrics-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { routePaths } from "@/lib/config";
import { Bell, ChevronRight, Moon, Search, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

const breadcrumbMap: Record<string, string> = {
  [routePaths.dashboard]: "Dashboard",
  [routePaths.analytics]: "Analytics",
  [routePaths.operations]: "Operations",
  [routePaths.brokers]: "Brokers",
  [routePaths.properties]: "Properties",
  [routePaths.subscriptions]: "Subscriptions",
  [routePaths.notifications]: "Notifications",
  [routePaths.waitlist]: "Waitlist",
  [routePaths.audit]: "Audit Logs",
  [routePaths.system]: "System",
};

export function Topbar({ title }: { title: string }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { metrics } = useMetrics();
  const pathname = usePathname();

  const now = useMemo(
    () =>
      new Date().toLocaleString(undefined, {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  );

  const openCommandPalette = () => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
    );
  };

  const pendingCount = (metrics?.pendingProperties ?? 0) + (metrics?.pendingBrokers ?? 0);

  return (
    <header
      className="flex h-[68px] items-center justify-between border-b px-6"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div>
        <nav className="mb-0.5 flex items-center gap-1 text-xs muted" aria-label="Breadcrumb">
          <Link href={routePaths.dashboard} className="hover:text-[var(--foreground)]">
            Home
          </Link>
          {pathname !== routePaths.dashboard ? (
            <>
              <ChevronRight size={12} className="opacity-50" />
              <span className="font-medium" style={{ color: "var(--foreground)" }}>
                {breadcrumbMap[pathname] || title}
              </span>
            </>
          ) : null}
        </nav>
        <h1 className="text-lg font-bold tracking-tight">{title}</h1>
        <p className="text-xs muted">{now}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={openCommandPalette}
          className="input hidden !cursor-pointer items-center gap-2 !py-1.5 md:flex md:min-w-72"
        >
          <Search size={15} className="muted" />
          <span className="flex-1 text-left text-sm muted">Search or jump to page...</span>
          <kbd className="rounded-md px-1.5 py-0.5 text-[10px]" style={{ background: "var(--surface-2)" }}>
            Ctrl K
          </kbd>
        </button>
        {pendingCount > 0 ? (
          <span
            className="hidden rounded-full px-2.5 py-1 text-[10px] font-semibold lg:inline-flex"
            style={{
              background: "color-mix(in srgb, var(--warning) 15%, transparent)",
              color: "var(--warning)",
            }}
          >
            {pendingCount} pending
          </span>
        ) : null}
        <Link
          href={routePaths.notifications}
          className="btn-ghost relative inline-flex items-center gap-1"
          title="Notifications"
        >
          <Bell size={18} />
          {(metrics?.notificationsUnread ?? 0) > 0 ? (
            <span
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
              style={{ background: "var(--danger)" }}
            >
              {Math.min(metrics?.notificationsUnread ?? 0, 9)}
              {(metrics?.notificationsUnread ?? 0) > 9 ? "+" : ""}
            </span>
          ) : null}
        </Link>
        <button type="button" onClick={toggleTheme} className="btn-ghost inline-flex items-center gap-2">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div
          className="hidden h-9 w-9 items-center justify-center rounded-full text-sm font-bold sm:flex"
          style={{
            background: "linear-gradient(135deg, var(--primary), var(--accent))",
            color: "var(--primary-foreground)",
          }}
        >
          {(user?.fname?.[0] ?? "A").toUpperCase()}
          {(user?.lname?.[0] ?? "").toUpperCase()}
        </div>
        <div className="hidden text-right md:block">
          <p className="text-sm font-semibold">
            {user?.fname} {user?.lname}
          </p>
          <p className="text-xs muted">{user?.role || "ADMIN"}</p>
        </div>
      </div>
    </header>
  );
}
