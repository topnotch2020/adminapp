"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { Moon, Sun } from "lucide-react";
import { useMemo } from "react";

export function Topbar({ title }: { title: string }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

  return (
    <header className="flex h-16 items-center justify-between border-b px-6" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-xs muted">{now}</p>
      </div>
      <div className="flex items-center gap-3">
        <input
          className="input hidden min-w-64 !py-1.5 md:block"
          placeholder="Quick search (UI)"
        />
        <button onClick={toggleTheme} className="btn-secondary inline-flex items-center gap-2">
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          {theme === "dark" ? "Light" : "Dark"}
        </button>
        <div className="text-right">
          <p className="text-sm font-medium">
            {user?.fname} {user?.lname}
          </p>
          <p className="text-xs muted">{user?.email}</p>
        </div>
      </div>
    </header>
  );
}
