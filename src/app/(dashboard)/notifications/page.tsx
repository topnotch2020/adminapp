"use client";

import { notificationsApi } from "@/lib/api/modules/notifications";
import { DetailSidebar } from "@/components/ui/detail-sidebar";
import { useToast } from "@/components/providers/toast-provider";
import type { Notification } from "@/types/domain";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function NotificationsPage() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [activeId, setActiveId] = useState<string | null>(null);
  const limit = 20;

  const load = useCallback(async (nextSkip = skip) => {
    setLoading(true);
    try {
      const result = await notificationsApi.list({ limit, skip: nextSkip });
      setNotifications(result.items);
      setHasMore(Boolean(result.pagination?.hasMore));
    } catch {
      showToast({ type: "error", title: "Unable to load notifications" });
    } finally {
      setLoading(false);
    }
  }, [showToast, skip]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(0);
  }, [load]);

  const filtered = useMemo(
    () =>
      notifications.filter((notification) => {
        const matchesSearch = notification.message
          ?.toLowerCase()
          .includes(search.toLowerCase());
        const matchesVisibility =
          visibility === "ALL" ||
          (visibility === "UNREAD" && notification.unread) ||
          (visibility === "READ" && !notification.unread);
        const matchesType = typeFilter === "ALL" || notification.type === typeFilter;
        return Boolean(matchesSearch) && matchesVisibility && matchesType;
      }),
    [notifications, search, typeFilter, visibility]
  );
  const activeNotification =
    filtered.find((notification) => notification._id === activeId) || null;
  const typeOptions = useMemo(
    () => ["ALL", ...Array.from(new Set(notifications.map((item) => item.type).filter(Boolean)))],
    [notifications]
  );
  const unreadCount = filtered.filter((item) => item.unread).length;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm muted">
            {filtered.length} records ({unreadCount} unread)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="input !py-1.5"
            placeholder="Search notifications"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="input !py-1.5"
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as typeof visibility)}
          >
            <option value="ALL">All</option>
            <option value="UNREAD">Unread</option>
            <option value="READ">Read</option>
          </select>
          <select
            className="input !py-1.5"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            {typeOptions.map((type) => (
              <option value={type} key={type}>
                {type}
              </option>
            ))}
          </select>
          <button className="btn-secondary" onClick={() => void load()}>
            Refresh
          </button>
        </div>
      </div>
      <div className="panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead style={{ background: "var(--surface-2)" }} className="muted">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Sent By</th>
              <th className="px-4 py-3">Sent To</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 muted" colSpan={7}>
                  Loading notifications...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 muted" colSpan={7}>
                  No notifications available.
                </td>
              </tr>
            ) : (
              filtered.map((notification) => {
                const recipient =
                  typeof notification.brokerId === "string"
                    ? notification.brokerId
                    : notification.brokerId?.email ||
                      `${notification.brokerId?.fname || ""} ${notification.brokerId?.lname || ""}`.trim() ||
                      "-";
                const sender =
                  (notification.metadata?.senderName as string | undefined) ||
                  (notification.metadata?.triggeredBy as string | undefined) ||
                  "System";
                return (
                  <tr key={notification._id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3">{notification.type}</td>
                    <td className="px-4 py-3">{notification.message}</td>
                    <td className="px-4 py-3">{sender}</td>
                    <td className="px-4 py-3">{recipient}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2 py-1 text-xs" style={{ background: "var(--surface-2)" }}>
                        {notification.unread ? "Unread" : "Read"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{new Date(notification.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <button className="btn-secondary !py-1" onClick={() => setActiveId(notification._id)}>
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          className="btn-secondary"
          disabled={skip === 0}
          onClick={() => {
            const nextSkip = Math.max(skip - limit, 0);
            setSkip(nextSkip);
            void load(nextSkip);
          }}
        >
          Previous
        </button>
        <button
          className="btn-secondary"
          disabled={!hasMore}
          onClick={() => {
            const nextSkip = skip + limit;
            setSkip(nextSkip);
            void load(nextSkip);
          }}
        >
          Next
        </button>
      </div>
      <DetailSidebar
        open={Boolean(activeNotification)}
        title="Notification Detail View"
        subtitle={activeNotification?.type}
        onClose={() => setActiveId(null)}
        widthClassName="max-w-xl"
      >
        {activeNotification ? (
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <p><span className="muted">Type:</span> {activeNotification.type}</p>
            <p><span className="muted">Status:</span> {activeNotification.unread ? "Unread" : "Read"}</p>
            <p className="md:col-span-2"><span className="muted">Message:</span> {activeNotification.message}</p>
            <p>
              <span className="muted">Sent To:</span>{" "}
              {typeof activeNotification.brokerId === "string"
                ? activeNotification.brokerId
                : activeNotification.brokerId?.email ||
                  `${activeNotification.brokerId?.fname || ""} ${activeNotification.brokerId?.lname || ""}`.trim() ||
                  "-"}
            </p>
            <p>
              <span className="muted">Sent By:</span>{" "}
              {(activeNotification.metadata?.senderName as string | undefined) ||
                (activeNotification.metadata?.triggeredBy as string | undefined) ||
                "System"}
            </p>
            <p><span className="muted">Property:</span> {activeNotification.propertyId || "-"}</p>
            <p><span className="muted">Action URL:</span> {activeNotification.actionUrl || "-"}</p>
            <p><span className="muted">Created:</span> {new Date(activeNotification.createdAt).toLocaleString()}</p>
          </div>
        ) : null}
      </DetailSidebar>
    </section>
  );
}
