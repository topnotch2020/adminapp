"use client";

import { PageHeader } from "@/components/ui/page-header";
import { QueuePanel, QueuePanelSkeleton, type QueueItem } from "@/components/ui/queue-panel";
import { useToast } from "@/components/providers/toast-provider";
import { brokersApi } from "@/lib/api/modules/brokers";
import { notificationsApi } from "@/lib/api/modules/notifications";
import { propertiesApi } from "@/lib/api/modules/properties";
import { subscriptionsApi } from "@/lib/api/modules/subscriptions";
import { getApiErrorMessage } from "@/lib/admin-auth";
import { routePaths } from "@/lib/config";
import type { Broker, Notification, Property } from "@/types/domain";
import { AlertTriangle, Bell, Building2, CreditCard, Home, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

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
    void load();
  }, [load]);

  const brokerItems: QueueItem[] = useMemo(
    () =>
      snapshot.pendingBrokers.map((broker) => ({
        id: broker._id,
        primary: `${broker.fname} ${broker.lname}`,
        secondary: broker.email,
        meta: broker.status ?? "PENDING",
      })),
    [snapshot.pendingBrokers]
  );

  const propertyItems: QueueItem[] = useMemo(
    () =>
      snapshot.pendingProperties.map((property) => ({
        id: property._id || property.id || String(property.address?.projectName),
        primary: property.address?.projectName || "Unnamed listing",
        secondary: [property.address?.areaName, property.address?.city].filter(Boolean).join(", ") || "—",
        meta: property.status || "UNVERIFIED",
      })),
    [snapshot.pendingProperties]
  );

  const notificationItems: QueueItem[] = useMemo(
    () =>
      snapshot.unreadNotifications.map((item) => ({
        id: item._id,
        primary: item.message,
        secondary: item.type,
        meta: new Date(item.createdAt).toLocaleDateString(),
      })),
    [snapshot.unreadNotifications]
  );

  const subscriptionItems: QueueItem[] = useMemo(
    () =>
      snapshot.lowCapacitySubscriptions.map((item, index) => ({
        id: `sub-${index}`,
        primary: item.brokerName || "Unknown broker",
        secondary: `${item.remainingSlots} of ${item.totalSlots} slots remaining`,
        meta: item.remainingSlots === 0 ? "FULL" : "LOW",
      })),
    [snapshot.lowCapacitySubscriptions]
  );

  const totalPending =
    snapshot.pendingBrokers.length +
    snapshot.pendingProperties.length +
    snapshot.unreadNotifications.length;

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Daily workflow"
        title="Operations Center"
        description="High-priority queues for broker verification, listing moderation, alerts, and subscription capacity."
        actions={
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            onClick={() => void load()}
          >
            <RefreshCcw size={14} />
            Refresh
          </button>
        }
      />

      {!loading ? (
        <article className="panel flex flex-wrap items-center gap-4 p-4">
          <span
            className={`status-dot ${totalPending > 0 ? "status-dot-warning" : ""}`}
            aria-hidden
          />
          <p className="text-sm">
            <span className="font-semibold">{totalPending}</span>{" "}
            <span className="muted">items need attention across all queues</span>
          </p>
        </article>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <QueuePanelSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <QueuePanel
            title="Pending Broker Verifications"
            icon={Building2}
            items={brokerItems}
            href={routePaths.brokers}
            accent="warning"
            emptyTitle="No pending brokers"
            emptyDescription="All broker accounts are verified or processed."
          />
          <QueuePanel
            title="Pending Property Moderation"
            icon={Home}
            items={propertyItems}
            href={routePaths.properties}
            accent="warning"
            emptyTitle="Moderation queue clear"
            emptyDescription="No listings waiting for review."
          />
          <QueuePanel
            title="Unread Notifications"
            icon={Bell}
            items={notificationItems}
            href={routePaths.notifications}
            accent="danger"
            emptyTitle="Inbox zero"
            emptyDescription="No unread notifications right now."
          />
          <QueuePanel
            title="Low Slot Capacity"
            icon={CreditCard}
            items={subscriptionItems}
            href={routePaths.subscriptions}
            accent="primary"
            emptyTitle="Capacity looks healthy"
            emptyDescription="No brokers are near their listing slot limit."
          />
        </div>
      )}

      {!loading && totalPending > 0 ? (
        <article
          className="flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm"
          style={{
            borderColor: "color-mix(in srgb, var(--warning) 35%, var(--border))",
            background: "color-mix(in srgb, var(--warning) 8%, var(--surface))",
          }}
        >
          <AlertTriangle size={18} style={{ color: "var(--warning)" }} className="shrink-0 mt-0.5" />
          <p>
            Start with <strong>broker verification</strong> and <strong>property moderation</strong>{" "}
            — they affect what brokers and buyers see on the platform.
          </p>
        </article>
      ) : null}
    </section>
  );
}
