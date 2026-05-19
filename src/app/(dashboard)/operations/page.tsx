"use client";

import { brokersApi } from "@/lib/api/modules/brokers";
import { notificationsApi } from "@/lib/api/modules/notifications";
import { propertiesApi } from "@/lib/api/modules/properties";
import { subscriptionsApi } from "@/lib/api/modules/subscriptions";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/lib/admin-auth";
import { useCallback, useEffect, useState } from "react";
import type { Broker, Notification, Property } from "@/types/domain";

type OpsSnapshot = {
  pendingBrokers: Broker[];
  pendingProperties: Property[];
  unreadNotifications: Notification[];
  lowCapacitySubscriptions: {
    brokerName?: string;
    remainingSlots: number;
    totalSlots: number;
  }[];
};

export default function OperationsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<OpsSnapshot>({
    pendingBrokers: [],
    pendingProperties: [],
    unreadNotifications: [],
    lowCapacitySubscriptions: [],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [brokers, properties, notifications, subscriptions] = await Promise.all([
        brokersApi.list({ limit: 50, status: "PENDING_VERIFICATION" }),
        propertiesApi.list({ limit: 50, status: "UNVERIFIED" }),
        notificationsApi.list({ limit: 50, skip: 0 }),
        subscriptionsApi.list(),
      ]);

      setSnapshot({
        pendingBrokers: brokers.items,
        pendingProperties: properties.items ?? [],
        unreadNotifications: (notifications.items ?? []).filter((item) => item.unread),
        lowCapacitySubscriptions: subscriptions
          .filter((item) => item.remainingSlots <= 2)
          .map((item) => ({
            brokerName: item.brokerName,
            remainingSlots: item.remainingSlots,
            totalSlots: item.totalSlots,
          })),
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Unable to load operations queues",
        description: getApiErrorMessage(error, "Check API connectivity and admin permissions."),
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="panel-title">Operations Center</h2>
          <p className="text-sm muted">High-priority queues for daily admin actions.</p>
        </div>
        <button className="btn-primary" onClick={() => void load()}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="panel p-5 text-sm muted">Loading operations queues...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <QueuePanel
            title="Pending Broker Verifications"
            items={snapshot.pendingBrokers.map(
              (broker) =>
                `${broker.fname} ${broker.lname} (${broker.email}) - ${broker.status ?? "PENDING"}`
            )}
          />
          <QueuePanel
            title="Pending Property Moderation"
            items={snapshot.pendingProperties.map(
              (property) =>
                `${property.address?.projectName || "Unnamed"} / ${property.address?.city || "-"} - ${property.status || "UNVERIFIED"}`
            )}
          />
          <QueuePanel
            title="Unread Notifications"
            items={snapshot.unreadNotifications.map((item) => `${item.type} - ${item.message}`)}
          />
          <QueuePanel
            title="Low Slot Capacity Brokers"
            items={snapshot.lowCapacitySubscriptions.map(
              (item) =>
                `${item.brokerName || "Unknown Broker"} - ${item.remainingSlots}/${item.totalSlots} slots left`
            )}
          />
        </div>
      )}
    </section>
  );
}

function QueuePanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: "var(--surface-2)" }}>
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm muted">No items in this queue.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {items.slice(0, 8).map((item) => (
            <li key={item} className="rounded-lg px-3 py-2" style={{ background: "var(--surface-2)" }}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
