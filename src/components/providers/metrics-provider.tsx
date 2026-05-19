"use client";

import { brokersApi } from "@/lib/api/modules/brokers";
import type { DashboardMetrics } from "@/types/domain";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type MetricsContextShape = {
  metrics: DashboardMetrics | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const MetricsContext = createContext<MetricsContextShape | null>(null);

export function MetricsProvider({ children }: { children: React.ReactNode }) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await brokersApi.dashboardMetrics();
      setMetrics(data);
    } catch {
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), 60_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const value = useMemo(
    () => ({ metrics, loading, refresh }),
    [loading, metrics, refresh]
  );

  return <MetricsContext.Provider value={value}>{children}</MetricsContext.Provider>;
}

export function useMetrics() {
  const context = useContext(MetricsContext);
  if (!context) throw new Error("useMetrics must be used within MetricsProvider");
  return context;
}
