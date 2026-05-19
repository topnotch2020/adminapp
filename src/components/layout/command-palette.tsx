"use client";

import { routePaths } from "@/lib/config";
import {
  ActivitySquare,
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  Database,
  Home,
  LayoutDashboard,
  Mail,
  Radar,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const commands = [
  { label: "Dashboard", href: routePaths.dashboard, icon: LayoutDashboard, group: "Navigate" },
  { label: "Analytics", href: routePaths.analytics, icon: BarChart3, group: "Navigate" },
  { label: "Operations Center", href: routePaths.operations, icon: Radar, group: "Navigate" },
  { label: "Brokers", href: routePaths.brokers, icon: Building2, group: "Navigate" },
  { label: "Properties", href: routePaths.properties, icon: Home, group: "Navigate" },
  { label: "Subscriptions", href: routePaths.subscriptions, icon: CreditCard, group: "Navigate" },
  { label: "Notifications", href: routePaths.notifications, icon: Bell, group: "Navigate" },
  { label: "Waitlist", href: routePaths.waitlist, icon: Mail, group: "Navigate" },
  { label: "Audit Logs", href: routePaths.audit, icon: ActivitySquare, group: "Navigate" },
  { label: "System", href: routePaths.system, icon: Database, group: "Navigate" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return commands;
    return commands.filter((item) => item.label.toLowerCase().includes(normalized));
  }, [query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <section
        className="panel-elevated w-full max-w-xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <Search size={18} className="muted" />
          <input
            autoFocus
            className="w-full bg-transparent text-sm outline-none"
            placeholder="Search pages and jump instantly..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <kbd className="rounded-md px-2 py-0.5 text-[10px] muted" style={{ background: "var(--surface-2)" }}>
            ESC
          </kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm muted">No matches found</li>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-[var(--surface-2)]"
                    onClick={() => go(item.href)}
                  >
                    <Icon size={16} style={{ color: "var(--primary)" }} />
                    <span className="flex-1 font-medium">{item.label}</span>
                    <span className="text-xs muted">{item.group}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </section>
    </div>
  );
}

export function useCommandPalette() {
  return {
    openPalette: () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
    },
  };
}
