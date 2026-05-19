"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useMetrics } from "@/components/providers/metrics-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { routePaths } from "@/lib/config";
import { Bell, Moon, Search, Sun } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export function Topbar({ title }: { title: string }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { metrics } = useMetrics();
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

  return (
    <header
      className="flex h-[68px] items-center justify-between border-b px-6"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div>
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
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold">
            {user?.fname} {user?.lname}
          </p>
          <p className="text-xs muted">{user?.role || "ADMIN"}</p>
        </div>
      </div>
    </header>
  );
}
