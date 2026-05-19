import { EmptyState } from "@/components/ui/empty-state";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export type QueueItem = {
  id: string;
  primary: string;
  secondary?: string;
  meta?: string;
};

export function QueuePanel({
  title,
  icon: Icon,
  items,
  href,
  emptyTitle = "Queue is empty",
  emptyDescription = "Nothing needs attention right now.",
  accent = "primary",
}: {
  title: string;
  icon: LucideIcon;
  items: QueueItem[];
  href?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  accent?: "primary" | "warning" | "danger";
}) {
  const colors = {
    primary: "var(--primary)",
    warning: "var(--warning)",
    danger: "var(--danger)",
  };

  return (
    <article className="panel flex flex-col p-5">
      <header className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              background: `color-mix(in srgb, ${colors[accent]} 14%, transparent)`,
              color: colors[accent],
            }}
          >
            <Icon size={17} />
          </span>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums"
          style={{ background: "var(--surface-2)" }}
        >
          {items.length}
        </span>
      </header>

      {items.length === 0 ? (
        <EmptyState icon={<Icon size={22} />} title={emptyTitle} description={emptyDescription} />
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 8).map((item) => (
            <li key={item.id} className="queue-item">
              <p className="truncate text-sm font-medium">{item.primary}</p>
              {item.secondary ? (
                <p className="mt-0.5 truncate text-xs muted">{item.secondary}</p>
              ) : null}
              {item.meta ? (
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wide muted">
                  {item.meta}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {href && items.length > 0 ? (
        <footer className="mt-4 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <Link href={href} className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
            View all →
          </Link>
        </footer>
      ) : null}
    </article>
  );
}

export function QueuePanelSkeleton() {
  return (
    <article className="panel space-y-3 p-5">
      <div className="skeleton h-9 w-48" aria-hidden />
      <div className="skeleton h-12 w-full rounded-lg" aria-hidden />
      <div className="skeleton h-12 w-full rounded-lg" aria-hidden />
      <div className="skeleton h-12 w-full rounded-lg" aria-hidden />
    </article>
  );
}
