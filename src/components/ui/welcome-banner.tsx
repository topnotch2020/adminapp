"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useMetrics } from "@/components/providers/metrics-provider";
import { Sparkles } from "lucide-react";
import { useMemo } from "react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function WelcomeBanner() {
  const { user } = useAuth();
  const { metrics, loading } = useMetrics();

  const pendingTotal = useMemo(
    () => (metrics?.pendingProperties ?? 0) + (metrics?.pendingBrokers ?? 0),
    [metrics]
  );

  const firstName = user?.fname?.trim() || "Admin";

  return (
    <article className="welcome-banner">
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            {getGreeting()}
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
            {firstName}, welcome back
          </h2>
          <p className="mt-2 max-w-lg text-sm text-white/80">
            {loading
              ? "Loading platform snapshot..."
              : pendingTotal > 0
                ? `You have ${pendingTotal} item${pendingTotal === 1 ? "" : "s"} waiting for review across brokers and listings.`
                : "All queues are clear — great work keeping the platform healthy."}
          </p>
        </div>
        <span className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white md:flex">
          <Sparkles size={28} />
        </span>
      </div>
    </article>
  );
}
