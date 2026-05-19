"use client";

import { routePaths } from "@/lib/config";
import {
  ActivitySquare,
  Bell,
  Building2,
  CreditCard,
  Database,
  Home,
  LayoutDashboard,
  LogOut,
  Radar,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

const navSections = [
  {
    title: "Overview",
    items: [
      { href: routePaths.dashboard, label: "Dashboard", icon: LayoutDashboard },
      { href: routePaths.operations, label: "Operations", icon: Radar },
    ],
  },
  {
    title: "Management",
    items: [
      { href: routePaths.brokers, label: "Brokers", icon: Building2 },
      { href: routePaths.properties, label: "Properties", icon: Home },
      { href: routePaths.subscriptions, label: "Subscriptions", icon: CreditCard },
      { href: routePaths.notifications, label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "Governance",
    items: [
      { href: routePaths.audit, label: "Audit Logs", icon: ActivitySquare },
      { href: routePaths.system, label: "System", icon: Database },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <aside
      className="sticky top-0 flex h-screen w-72 shrink-0 flex-col border-r"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="flex h-16 items-center border-b px-5" style={{ borderColor: "var(--border)" }}>
        <div>
          <p className="text-sm font-semibold tracking-wide" style={{ color: "var(--primary)" }}>
            AdminApp
          </p>
          <p className="text-xs muted">Operations Console</p>
        </div>
      </div>
      <div className="px-3 pt-3">
        <div
          className="rounded-xl border px-3 py-2"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          <p className="text-xs muted">Signed in as</p>
          <p className="text-sm font-medium">{user?.fname} {user?.lname}</p>
          <p className="text-xs muted">{user?.role || "ADMIN"}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="px-2 pb-1 text-[11px] uppercase tracking-wide muted">{section.title}</p>
            <nav className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                      active
                        ? "text-cyan-300"
                        : "hover:bg-slate-200/40 dark:hover:bg-slate-700/40"
                    }`}
                    style={active ? { background: "var(--surface-2)" } : undefined}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
      <div className="border-t p-3" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={() => void logout()}
          className="btn-secondary flex w-full items-center justify-center gap-2"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
