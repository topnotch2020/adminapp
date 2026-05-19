"use client";

import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { MiniBarChart } from "@/components/ui/mini-bar-chart";
import { useMetrics } from "@/components/providers/metrics-provider";
import { routePaths } from "@/lib/config";
import {
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle2,
  Home,
  Mail,
  RefreshCcw,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function DashboardPage() {
  const { metrics, loading, refresh } = useMetrics();

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

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Control Center"
        title="Platform Overview"
        description="Monitor broker growth, listing moderation, subscriptions, and platform health in real time."
        actions={
          <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={() => void refresh()}>
            <RefreshCcw size={14} />
            Refresh
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="panel-elevated p-5 md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider muted">System health</p>
          <div className="mt-3 flex items-end gap-4">
            <p className="text-5xl font-bold" style={{ color: healthScore >= 70 ? "var(--success)" : "var(--warning)" }}>
              {healthScore}
            </p>
            <p className="pb-2 text-sm muted">/ 100 — based on moderation queue and unread alerts</p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${healthScore}%`,
                background: "linear-gradient(90deg, var(--primary), var(--accent))",
              }}
            />
          </div>
        </article>
        <StatCard
          title="New this week"
          value={(metrics?.brokersLast7Days ?? 0) + (metrics?.propertiesLast7Days ?? 0)}
          hint={`${metrics?.brokersLast7Days ?? 0} brokers · ${metrics?.propertiesLast7Days ?? 0} listings`}
          icon={<TrendingUp size={18} />}
          accent="success"
        />
      </div>

      {loading ? (
        <div className="panel p-5 text-sm muted">Loading metrics...</div>
      ) : (
        <>
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
              <h3 className="text-sm font-semibold uppercase tracking-wide muted">Listing status breakdown</h3>
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

          <article className="panel p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide muted">Broker status breakdown</h3>
            <div className="mt-4 max-w-xl">
              <MiniBarChart data={brokerBreakdown} labelKey="label" valueKey="value" color="var(--accent)" />
            </div>
          </article>
        </>
      )}
    </section>
  );
}
