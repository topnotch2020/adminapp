import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      {icon ? (
        <span
          className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{
            background: "color-mix(in srgb, var(--primary) 12%, transparent)",
            color: "var(--primary)",
          }}
        >
          {icon}
        </span>
      ) : null}
      <p className="text-sm font-semibold">{title}</p>
      {description ? <p className="mt-1 max-w-xs text-xs muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
