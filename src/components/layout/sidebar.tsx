"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useMetrics } from "@/components/providers/metrics-provider";
import { appConfig, routePaths } from "@/lib/config";
import {
  ActivitySquare,
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  Database,
  Home,
  LayoutDashboard,
  LogOut,
  Mail,
  Radar,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navSections = [
  {
    title: "Overview",
    items: [
      { href: routePaths.dashboard, label: "Dashboard", icon: LayoutDashboard },
      { href: routePaths.analytics, label: "Analytics", icon: BarChart3 },
      { href: routePaths.operations, label: "Operations", icon: Radar, badgeKey: "operations" as const },
    ],
  },
  {
    title: "Management",
    items: [
      { href: routePaths.brokers, label: "Brokers", icon: Building2, badgeKey: "brokers" as const },
      { href: routePaths.properties, label: "Properties", icon: Home, badgeKey: "properties" as const },
      { href: routePaths.subscriptions, label: "Subscriptions", icon: CreditCard },
      { href: routePaths.notifications, label: "Notifications", icon: Bell, badgeKey: "notifications" as const },
      { href: routePaths.waitlist, label: "Waitlist", icon: Mail, badgeKey: "waitlist" as const },
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
  const { metrics } = useMetrics();

  const badges: Record<string, number> = {
    operations: (metrics?.pendingBrokers ?? 0) + (metrics?.pendingProperties ?? 0),
    brokers: metrics?.pendingBrokers ?? 0,
    properties: metrics?.pendingProperties ?? 0,
    notifications: metrics?.notificationsUnread ?? 0,
    waitlist: metrics?.waitlistTotal ?? 0,
  };

  return (
    <aside
      className="sticky top-0 flex h-screen w-[280px] shrink-0 flex-col border-r"
      style={{ borderColor: "var(--border)", background: "var(--sidebar)" }}
    >
      <div
        className="flex h-[72px] items-center gap-3 border-b px-5"
        style={{ borderColor: "var(--border)" }}
      >
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            background: "linear-gradient(135deg, var(--primary), var(--accent))",
            color: "var(--primary-foreground)",
          }}
        >
          <Sparkles size={18} />
        </span>
        <div>
          <p className="text-sm font-bold tracking-tight">{appConfig.productName}</p>
          <p className="text-[11px] font-medium uppercase tracking-wider muted">Admin Console</p>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div
          className="rounded-xl border px-3 py-2.5"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider muted">Signed in</p>
          <p className="mt-0.5 text-sm font-semibold">
            {user?.fname} {user?.lname}
          </p>
          <p className="truncate text-xs muted">{user?.email}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] muted">
              {section.title}
            </p>
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                const badge = item.badgeKey ? badges[item.badgeKey] : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active ? "nav-link-active" : ""
                    }`}
                  >
                    <Icon size={17} className={active ? "" : "muted group-hover:text-[var(--foreground)]"} />
                    <span className="flex-1">{item.label}</span>
                    {badge > 0 ? (
                      <span className="badge badge-warning min-w-[1.25rem] justify-center">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="mx-4 mb-3 rounded-xl border px-3 py-2.5" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
        <div className="flex items-center gap-2">
          <span className="status-dot" aria-hidden />
          <p className="text-xs font-semibold">Platform status</p>
        </div>
        <p className="mt-1 text-[11px] muted">
          {(metrics?.pendingProperties ?? 0) + (metrics?.pendingBrokers ?? 0) > 0
            ? `${(metrics?.pendingProperties ?? 0) + (metrics?.pendingBrokers ?? 0)} items in review queues`
            : "All moderation queues clear"}
        </p>
      </div>

      <footer className="border-t p-4" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={() => void logout()}
          className="btn-secondary flex w-full items-center justify-center gap-2"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </footer>
    </aside>
  );
}
