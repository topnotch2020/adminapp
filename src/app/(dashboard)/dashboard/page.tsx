"use client";

import { brokersApi } from "@/lib/api/modules/brokers";
import { notificationsApi } from "@/lib/api/modules/notifications";
import { propertiesApi } from "@/lib/api/modules/properties";
import { subscriptionsApi } from "@/lib/api/modules/subscriptions";
import { useToast } from "@/components/providers/toast-provider";
import { routePaths } from "@/lib/config";
import { AlertTriangle, Bell, Building2, CheckCircle2, Home, RefreshCcw, Shield } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type DashboardMetrics = {
  totalProperties: number;
  brokersTotal: number;
  adminsTotal: number;
  pendingProperties: number;
  unreadNotifications: number;
  rentCount: number;
  saleCount: number;
  subscriptionsTracked: number;
};

export default function DashboardPage() {
  const { showToast } = useToast();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const load = useCallback(async (showRefreshToast = false) => {
    setLoading(true);
    try {
      const [properties, unread, metrics, subscriptions] = await Promise.all([
        propertiesApi.list({ limit: 200 }),
        notificationsApi.unreadCount(),
        brokersApi.dashboardMetrics(),
        subscriptionsApi.list(),
      ]);
      const allProperties = properties.items ?? [];
      const rentCount = allProperties.filter((property) => property.listingType === "RENT").length;
      const saleCount = allProperties.filter((property) => property.listingType === "SALE").length;
      setMetrics({
        totalProperties: metrics.propertiesTotal ?? allProperties.length,
        brokersTotal: metrics.brokersTotal ?? 0,
        adminsTotal: metrics.adminsTotal ?? 0,
        pendingProperties: metrics.pendingProperties ?? 0,
        unreadNotifications: unread,
        rentCount,
        saleCount,
        subscriptionsTracked: subscriptions.length,
      });
      setLastSync(new Date().toLocaleTimeString());
      if (showRefreshToast) {
        showToast({ type: "success", title: "Dashboard refreshed" });
      }
    } catch {
      showToast({ type: "error", title: "Failed to load dashboard metrics" });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const healthScore = useMemo(() => {
    if (!metrics) return 0;
    const moderationPenalty = Math.min(metrics.pendingProperties * 2, 40);
    const alertPenalty = Math.min(metrics.unreadNotifications, 30);
    return Math.max(100 - moderationPenalty - alertPenalty, 0);
  }, [metrics]);

  return (
    <section className="space-y-6">
      <div className="panel p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] muted">Control Center</p>
            <h2 className="panel-title mt-2">Platform Overview</h2>
            <p className="mt-2 text-sm muted">
              Monitor broker growth, listing moderation, and integrations from one place.
            </p>
          </div>
          <button className="btn-secondary inline-flex items-center gap-2" onClick={() => void load(true)}>
            <RefreshCcw size={14} />
            Refresh
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl px-3 py-2" style={{ background: "var(--surface-2)" }}>
            <p className="text-xs muted">System Health Score</p>
            <p className="text-xl font-semibold">{healthScore}/100</p>
          </div>
          <div className="rounded-xl px-3 py-2" style={{ background: "var(--surface-2)" }}>
            <p className="text-xs muted">Last Sync</p>
            <p className="text-xl font-semibold">{lastSync || "-"}</p>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="panel p-5 text-sm text-slate-500">Loading metrics...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Metric title="Total Properties" value={metrics?.totalProperties ?? 0} icon={<Home size={16} />} />
            <Metric title="Brokers" value={metrics?.brokersTotal ?? 0} icon={<Building2 size={16} />} />
            <Metric title="Admins" value={metrics?.adminsTotal ?? 0} icon={<Shield size={16} />} />
            <Metric title="Unread Alerts" value={metrics?.unreadNotifications ?? 0} icon={<Bell size={16} />} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="panel p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide muted">
                Listing Distribution
              </h3>
              <div className="mt-5 space-y-4">
                <Progress label="Rent" value={metrics?.rentCount ?? 0} total={metrics?.totalProperties ?? 1} />
                <Progress label="Sale" value={metrics?.saleCount ?? 0} total={metrics?.totalProperties ?? 1} />
                <Progress label="Pending Review" value={metrics?.pendingProperties ?? 0} total={metrics?.totalProperties ?? 1} />
              </div>
            </div>

            <div className="panel p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide muted">
                Action Queue
              </h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <AlertTriangle size={15} className="mt-0.5 text-amber-500" />
                  <span>{metrics?.pendingProperties ?? 0} properties need moderation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Bell size={15} className="mt-0.5 text-cyan-500" />
                  <span>{metrics?.unreadNotifications ?? 0} unread notifications in queue.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="mt-0.5 text-emerald-500" />
                  <span>{metrics?.subscriptionsTracked ?? 0} subscription snapshots tracked.</span>
                </li>
              </ul>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <Link className="btn-secondary !py-1 text-center" href={routePaths.properties}>
                  Open Moderation
                </Link>
                <Link className="btn-secondary !py-1 text-center" href={routePaths.notifications}>
                  Open Alerts
                </Link>
                <Link className="btn-secondary !py-1 text-center" href={routePaths.operations}>
                  Open Operations
                </Link>
                <Link className="btn-secondary !py-1 text-center" href={routePaths.audit}>
                  Open Audit
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function Metric({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm muted">{title}</p>
        <span className="rounded-lg p-2" style={{ background: "var(--surface-2)" }}>
          {icon}
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold">
        {value}
      </p>
    </div>
  );
}

function Progress({ label, value, total }: { label: string; value: number; total: number }) {
  const percent = Math.min(Math.round((value / Math.max(total, 1)) * 100), 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="muted">{value} ({percent}%)</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
        <div className="h-full rounded-full" style={{ width: `${percent}%`, background: "var(--primary)" }} />
      </div>
    </div>
  );
}
