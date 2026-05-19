"use client";

import { ActivityFeed } from "@/components/ui/activity-feed";
import { MetricRing } from "@/components/ui/metric-ring";
import { MiniBarChart } from "@/components/ui/mini-bar-chart";
import { PageHeader } from "@/components/ui/page-header";
import { QuickActionCard } from "@/components/ui/quick-action-card";
import { StatCard } from "@/components/ui/stat-card";
import { PanelSkeleton, StatCardSkeleton } from "@/components/ui/skeleton";
import { WelcomeBanner } from "@/components/ui/welcome-banner";
import { useMetrics } from "@/components/providers/metrics-provider";
import { routePaths } from "@/lib/config";
import { systemApi } from "@/lib/api/modules/system";
import type { AuditLog } from "@/types/domain";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  CreditCard,
  Home,
  Mail,
  Radar,
  RefreshCcw,
  Shield,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function DashboardPage() {
  const { metrics, loading, refresh } = useMetrics();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    try {
      const result = await systemApi.auditLogs({ limit: 6, skip: 0 });
      setAuditLogs(result.items);
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  const healthScore = useMemo(() => {
    if (!metrics) return 0;
    const moderationPenalty = Math.min((metrics.pendingProperties ?? 0) * 2, 40);
    const alertPenalty = Math.min(metrics.notificationsUnread ?? 0, 30);
    return Math.max(100 - moderationPenalty - alertPenalty, 0);
  }, [metrics]);

  const formatStatusLabel = (status: string | null | undefined) =>
    (status ?? "Unknown").replace(/_/g, " ");

  const propertyBreakdown = (metrics?.propertyStatusBreakdown ?? []).map((row) => ({
    label: formatStatusLabel(row.status),
    value: row.count,
  }));

  const brokerBreakdown = (metrics?.brokerStatusBreakdown ?? []).map((row) => ({
    label: formatStatusLabel(row.status),
    value: row.count,
  }));

  const verificationRate = useMemo(() => {
    const total = metrics?.propertiesTotal ?? 0;
    if (!total) return 0;
    return Math.round(((metrics?.verifiedProperties ?? 0) / total) * 100);
  }, [metrics]);

  return (
    <section className="space-y-6">
      <WelcomeBanner />

      <PageHeader
        eyebrow="Control Center"
        title="Platform Overview"
        description="Monitor broker growth, listing moderation, subscriptions, and platform health in real time."
        actions={
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-2"
            onClick={() => {
              void refresh();
              void loadAudit();
            }}
          >
            <RefreshCcw size={14} />
            Refresh
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <QuickActionCard
          href={routePaths.operations}
          label="Operations"
          description="Review priority queues"
          icon={Radar}
          badge={(metrics?.pendingBrokers ?? 0) + (metrics?.pendingProperties ?? 0)}
          accent="warning"
        />
        <QuickActionCard
          href={routePaths.properties}
          label="Properties"
          description="Moderate listings"
          icon={Home}
          badge={metrics?.pendingProperties}
          accent="warning"
        />
        <QuickActionCard
          href={routePaths.brokers}
          label="Brokers"
          description="Verify accounts"
          icon={Building2}
          badge={metrics?.pendingBrokers}
        />
        <QuickActionCard
          href={routePaths.notifications}
          label="Alerts"
          description="Unread notifications"
          icon={Bell}
          badge={metrics?.notificationsUnread}
          accent="danger"
        />
        <QuickActionCard
          href={routePaths.analytics}
          label="Analytics"
          description="Growth & trends"
          icon={BarChart3}
        />
        <QuickActionCard
          href={routePaths.subscriptions}
          label="Subscriptions"
          description="Plans & slots"
          icon={CreditCard}
          accent="success"
        />
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <PanelSkeleton lines={2} />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <article className="panel-elevated flex flex-col items-center justify-center p-6 md:col-span-1">
              <MetricRing
                value={healthScore}
                label="Health score"
                sublabel="Moderation + alerts"
              />
            </article>
            <article className="panel-elevated p-5 lg:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider muted">
                    Platform pulse
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {verificationRate}% listings verified
                  </p>
                  <p className="mt-1 text-sm muted">
                    {metrics?.verifiedBrokers ?? 0} verified brokers ·{" "}
                    {metrics?.waitlistTotal ?? 0} on waitlist
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium uppercase tracking-wider muted">New this week</p>
                  <p className="mt-1 text-3xl font-bold" style={{ color: "var(--success)" }}>
                    {(metrics?.brokersLast7Days ?? 0) + (metrics?.propertiesLast7Days ?? 0)}
                  </p>
                  <p className="mt-1 text-xs muted">
                    {metrics?.brokersLast7Days ?? 0} brokers · {metrics?.propertiesLast7Days ?? 0} listings
                  </p>
                </div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${healthScore}%`,
                    background: "linear-gradient(90deg, var(--primary), var(--accent))",
                  }}
                />
              </div>
            </article>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Listings" value={metrics?.propertiesTotal ?? 0} icon={<Home size={18} />} />
            <StatCard title="Brokers" value={metrics?.brokersTotal ?? 0} icon={<Building2 size={18} />} accent="primary" />
            <StatCard title="Pending Review" value={metrics?.pendingProperties ?? 0} icon={<AlertTriangle size={18} />} accent="warning" />
            <StatCard title="Unread Alerts" value={metrics?.notificationsUnread ?? 0} icon={<Bell size={18} />} accent="danger" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Verified Brokers" value={metrics?.verifiedBrokers ?? 0} icon={<Users size={18} />} accent="success" />
            <StatCard title="Verified Listings" value={metrics?.verifiedProperties ?? 0} icon={<CheckCircle2 size={18} />} accent="success" />
            <StatCard title="Rent / Sale" value={`${metrics?.rentProperties ?? 0} / ${metrics?.saleProperties ?? 0}`} icon={<Home size={18} />} />
            <StatCard title="Waitlist" value={metrics?.waitlistTotal ?? 0} icon={<Mail size={18} />} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <article className="panel p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide muted">
                Listing status breakdown
              </h3>
              <div className="mt-4">
                <MiniBarChart data={propertyBreakdown} labelKey="label" valueKey="value" />
              </div>
            </article>

            <article className="panel p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide muted">Action queue</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <AlertTriangle size={15} className="mt-0.5" style={{ color: "var(--warning)" }} />
                  <span>{metrics?.pendingProperties ?? 0} properties awaiting moderation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users size={15} className="mt-0.5" style={{ color: "var(--primary)" }} />
                  <span>{metrics?.pendingBrokers ?? 0} brokers pending verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <Bell size={15} className="mt-0.5" style={{ color: "var(--danger)" }} />
                  <span>{metrics?.notificationsUnread ?? 0} unread notifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield size={15} className="mt-0.5 muted" />
                  <span>{metrics?.adminsTotal ?? 0} admin accounts active</span>
                </li>
              </ul>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Link className="btn-secondary !py-1.5 text-center text-xs" href={routePaths.properties}>
                  Moderate
                </Link>
                <Link className="btn-secondary !py-1.5 text-center text-xs" href={routePaths.brokers}>
                  Brokers
                </Link>
                <Link className="btn-secondary !py-1.5 text-center text-xs" href={routePaths.operations}>
                  Operations
                </Link>
                <Link className="btn-primary !py-1.5 text-center text-xs" href={routePaths.analytics}>
                  Analytics
                </Link>
              </div>
            </article>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <article className="panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide muted">
                  Broker status breakdown
                </h3>
              </div>
              <MiniBarChart data={brokerBreakdown} labelKey="label" valueKey="value" color="var(--accent)" />
            </article>

            <article className="panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide muted">Recent activity</h3>
                <Link href={routePaths.audit} className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                  View all
                </Link>
              </div>
              <ActivityFeed items={auditLogs} loading={auditLoading} />
            </article>
          </div>
        </>
      )}
    </section>
  );
}
