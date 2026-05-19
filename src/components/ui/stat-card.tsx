import type { ReactNode } from "react";

export function StatCard({
  title,
  value,
  hint,
  icon,
  trend,
  accent = "primary",
}: {
  title: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  trend?: { label: string; positive?: boolean };
  accent?: "primary" | "success" | "warning" | "danger";
}) {
  const colors = {
    primary: "var(--primary)",
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--danger)",
  };

  return (
    <article className="panel-elevated stat-card animate-fade-in p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider muted">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {hint ? <p className="mt-1 text-xs muted">{hint}</p> : null}
          {trend ? (
            <p
              className="mt-2 text-xs font-medium"
              style={{ color: trend.positive ? "var(--success)" : "var(--warning)" }}
            >
              {trend.label}
            </p>
          ) : null}
        </div>
        {icon ? (
          <span
            className="rounded-xl p-2.5"
            style={{
              background: `color-mix(in srgb, ${colors[accent]} 14%, transparent)`,
              color: colors[accent],
            }}
          >
            {icon}
          </span>
        ) : null}
      </div>
    </article>
  );
}
