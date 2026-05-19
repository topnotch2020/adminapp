import type { AuditLog } from "@/types/domain";
import { Clock } from "lucide-react";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function ActivityFeed({ items, loading }: { items: AuditLog[]; loading?: boolean }) {
  if (loading) {
    return (
      <ul className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="skeleton h-14 w-full rounded-xl" />
        ))}
      </ul>
    );
  }

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm muted">No recent activity recorded yet.</p>
    );
  }

  return (
    <ul className="activity-feed">
      {items.map((item) => (
        <li key={item.id} className="activity-feed-item">
          <span className="activity-feed-dot" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug">{item.message}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs muted">
              <span className="badge badge-primary !px-2 !py-0 !text-[10px]">{item.event}</span>
              {item.actor ? <span>{item.actor}</span> : null}
              <span className="inline-flex items-center gap-1">
                <Clock size={11} />
                {formatTime(item.createdAt)}
              </span>
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
