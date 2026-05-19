"use client";

import { PageHeader } from "@/components/ui/page-header";
import { MiniBarChart } from "@/components/ui/mini-bar-chart";
import { StatCard } from "@/components/ui/stat-card";
import { PanelSkeleton, StatCardSkeleton } from "@/components/ui/skeleton";
import { analyticsApi } from "@/lib/api/modules/analytics";
import type { AnalyticsOverview } from "@/types/domain";
import { BarChart3, MapPin, RefreshCcw, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await analyticsApi.overview(days);
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    if (!data) return { brokers: 0, properties: 0 };
    return data.dailyTrend.reduce(
      (acc, row) => ({
        brokers: acc.brokers + row.brokers,
        properties: acc.properties + row.properties,
      }),
      { brokers: 0, properties: 0 }
    );
  }, [data]);

  const topAreas = (data?.topAreas ?? []).map((row) => ({
    label: row.area,
    value: row.count,
  }));

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        description="Growth trends, listing mix, and geographic distribution across the platform."
        actions={
          <>
            <select
              className="input !py-1.5"
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
            <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={() => void load()}>
              <RefreshCcw size={14} />
              Refresh
            </button>
          </>
        }
      />

      {loading ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <PanelSkeleton lines={6} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              title="New brokers"
              value={totals.brokers}
              hint={`Last ${data?.rangeDays ?? days} days`}
              icon={<TrendingUp size={18} />}
              accent="primary"
            />
            <StatCard
              title="New listings"
              value={totals.properties}
              hint={`Last ${data?.rangeDays ?? days} days`}
              icon={<BarChart3 size={18} />}
              accent="success"
            />
            <StatCard
              title="Rent vs Sale"
              value={`${data?.listingMix.rent ?? 0} / ${data?.listingMix.sale ?? 0}`}
              hint={`${data?.listingMix.total ?? 0} total active`}
              icon={<BarChart3 size={18} />}
            />
          </div>

          <article className="panel p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide muted">Daily signups</h3>
            <div className="mt-6 overflow-x-auto">
              <div className="flex min-w-[640px] items-end gap-1.5" style={{ height: 180 }}>
                {data?.dailyTrend.map((row) => {
                  const total = row.brokers + row.properties;
                  const max = Math.max(
                    ...((data?.dailyTrend ?? []).map((item) => item.brokers + item.properties)),
                    1
                  );
                  const height = Math.max((total / max) * 140, total > 0 ? 8 : 2);
                  return (
                    <div key={row.date} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-md"
                        style={{
                          height,
                          background: "linear-gradient(180deg, var(--primary), var(--accent))",
                          opacity: total ? 1 : 0.25,
                        }}
                        title={`${row.date}: ${row.brokers} brokers, ${row.properties} listings`}
                      />
                      <span className="text-[9px] muted">{row.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <article className="panel p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide muted">
                <MapPin size={15} />
                Top areas by listings
              </h3>
              <div className="mt-4">
                <MiniBarChart data={topAreas} labelKey="label" valueKey="value" color="var(--accent)" />
              </div>
            </article>

            <article className="panel p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide muted">Daily breakdown</h3>
              <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto text-sm">
                {(data?.dailyTrend ?? [])
                  .slice()
                  .reverse()
                  .map((row) => (
                    <li
                      key={row.date}
                      className="flex items-center justify-between rounded-lg px-3 py-2"
                      style={{ background: "var(--surface-2)" }}
                    >
                      <span className="font-medium">{row.date}</span>
                      <span className="muted">
                        {row.brokers} brokers · {row.properties} listings
                      </span>
                    </li>
                  ))}
              </ul>
            </article>
          </div>
        </>
      )}
    </section>
  );
}
