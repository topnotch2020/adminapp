import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export function QuickActionCard({
  href,
  label,
  description,
  icon: Icon,
  accent = "primary",
  badge,
}: {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  accent?: "primary" | "success" | "warning" | "danger";
  badge?: number;
}) {
  const colors = {
    primary: "var(--primary)",
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--danger)",
  };

  return (
    <Link href={href} className="quick-action-card group">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-105"
        style={{
          background: `color-mix(in srgb, ${colors[accent]} 14%, transparent)`,
          color: colors[accent],
        }}
      >
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold">{label}</span>
          {badge != null && badge > 0 ? (
            <span className="badge badge-warning">{badge > 99 ? "99+" : badge}</span>
          ) : null}
        </span>
        <span className="mt-0.5 block truncate text-xs muted">{description}</span>
      </span>
    </Link>
  );
}
