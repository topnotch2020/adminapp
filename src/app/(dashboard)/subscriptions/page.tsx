"use client";

import { subscriptionsApi, SubscriptionSnapshot } from "@/lib/api/modules/subscriptions";
import { useToast } from "@/components/providers/toast-provider";
import { DetailSidebar } from "@/components/ui/detail-sidebar";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function SubscriptionsPage() {
  const { showToast } = useToast();
  const [snapshots, setSnapshots] = useState<SubscriptionSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<
    Record<string, { rentSlots: number; saleSlots: number }>
  >({});
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await subscriptionsApi.list();
      setSnapshots(data);
      const initialEdits: Record<
        string,
        { rentSlots: number; saleSlots: number }
      > = {};
      data.forEach((item) => {
        if (item.brokerId) {
          initialEdits[item.brokerId] = {
            rentSlots: item.rentSlots ?? 10,
            saleSlots: item.saleSlots ?? 10,
          };
        }
      });
      setEdits(initialEdits);
    } catch {
      showToast({ type: "error", title: "Unable to load subscriptions" });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  const filtered = useMemo(
    () =>
      snapshots.filter((item) => {
        const q = search.toLowerCase();
        return (
          (item.brokerName || "").toLowerCase().includes(q) ||
          (item.email || "").toLowerCase().includes(q) ||
          (item.planName || "").toLowerCase().includes(q)
        );
      }),
    [search, snapshots]
  );
  const activeSnapshot =
    filtered.find((item) => (item.brokerId || item.email) === activeId) || null;
  const lowCapacity = filtered.filter((item) => item.remainingSlots <= 2).length;
  const avgUtilization = filtered.length
    ? Math.round(
        filtered.reduce((acc, item) => acc + (item.usedSlots / Math.max(item.totalSlots, 1)) * 100, 0) /
          filtered.length
      )
    : 0;

  const saveSlotLimit = async (brokerId?: string) => {
    if (!brokerId) return;
    const draft = edits[brokerId];
    if (!draft) return;
    if (draft.rentSlots < 0 || draft.saleSlots < 0) return;
    setSaving(brokerId);
    try {
      await subscriptionsApi.update(brokerId, {
        rentSlots: draft.rentSlots,
        saleSlots: draft.saleSlots,
      });
      await load();
      showToast({ type: "success", title: "Subscription quota updated" });
    } catch {
      showToast({ type: "error", title: "Failed to update quota" });
    } finally {
      setSaving(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-end">
        <input
          className="input !py-1.5"
          placeholder="Search broker / email / plan"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="panel p-4">
          <p className="text-xs muted">Tracked Accounts</p>
          <p className="mt-1 text-xl font-semibold">{filtered.length}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs muted">Low Capacity</p>
          <p className="mt-1 text-xl font-semibold">{lowCapacity}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs muted">Average Utilization</p>
          <p className="mt-1 text-xl font-semibold">{avgUtilization}%</p>
        </div>
      </div>
      {loading ? (
        <div className="panel p-5 text-sm muted">Loading subscription snapshot...</div>
      ) : filtered.length === 0 ? (
        <div className="panel p-5 text-sm muted">No subscription records available.</div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full text-left text-sm">
              <thead className="muted" style={{ background: "var(--surface-2)" }}>
                <tr>
                  <th className="px-4 py-3 font-semibold">Broker</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Plan</th>
                  <th
                    className="whitespace-nowrap px-4 py-3 text-center font-semibold"
                    title="Used rent / sale slots"
                  >
                    Used (R/S)
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Rent limit</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Sale limit</th>
                  <th className="whitespace-nowrap px-4 py-3 text-center font-semibold">Total</th>
                  <th className="whitespace-nowrap px-4 py-3 text-center font-semibold">Remaining</th>
                  <th
                    className="whitespace-nowrap px-4 py-3 text-center font-semibold"
                    title="Remaining rent / sale slots"
                  >
                    Remaining (R/S)
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((snapshot) => (
                  <tr
                    key={snapshot.brokerId || snapshot.email}
                    className="border-t"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td
                      className="max-w-[160px] truncate px-4 py-3 font-medium"
                      title={snapshot.brokerName || undefined}
                    >
                      {snapshot.brokerName || "-"}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3" title={snapshot.email || undefined}>
                      {snapshot.email || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{snapshot.planName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-center tabular-nums">
                      {snapshot.usedRentSlots}/{snapshot.usedSaleSlots}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="input !w-20 !min-w-0 !py-1"
                        type="number"
                        min={0}
                        value={
                          snapshot.brokerId
                            ? edits[snapshot.brokerId]?.rentSlots ?? snapshot.rentSlots
                            : (snapshot.rentSlots ?? 10)
                        }
                        onChange={(event) => {
                          if (!snapshot.brokerId) return;
                          const value = Number(event.target.value);
                          setEdits((prev) => ({
                            ...prev,
                            [snapshot.brokerId as string]: {
                              rentSlots: value,
                              saleSlots:
                                prev[snapshot.brokerId as string]?.saleSlots ??
                                (snapshot.saleSlots ?? 10),
                            },
                          }));
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="input !w-20 !min-w-0 !py-1"
                        type="number"
                        min={0}
                        value={
                          snapshot.brokerId
                            ? edits[snapshot.brokerId]?.saleSlots ?? snapshot.saleSlots
                            : (snapshot.saleSlots ?? 10)
                        }
                        onChange={(event) => {
                          if (!snapshot.brokerId) return;
                          const value = Number(event.target.value);
                          setEdits((prev) => ({
                            ...prev,
                            [snapshot.brokerId as string]: {
                              rentSlots:
                                prev[snapshot.brokerId as string]?.rentSlots ??
                                (snapshot.rentSlots ?? 10),
                              saleSlots: value,
                            },
                          }));
                        }}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center tabular-nums">
                      {snapshot.totalSlots}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center tabular-nums">
                      {snapshot.remainingSlots}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center tabular-nums">
                      {snapshot.remainingRentSlots}/{snapshot.remainingSaleSlots}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          className="btn-primary !px-3 !py-1.5"
                          disabled={saving === snapshot.brokerId}
                          onClick={() => void saveSlotLimit(snapshot.brokerId)}
                        >
                          Save
                        </button>
                        <button
                          className="btn-secondary !px-3 !py-1.5"
                          onClick={() => setActiveId(snapshot.brokerId || snapshot.email || null)}
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <DetailSidebar
        open={Boolean(activeSnapshot)}
        title="Subscription Detail View"
        subtitle={activeSnapshot?.brokerName || activeSnapshot?.email}
        onClose={() => setActiveId(null)}
        widthClassName="max-w-xl"
      >
        {activeSnapshot ? (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <p><span className="muted">Broker:</span> {activeSnapshot.brokerName || "-"}</p>
              <p><span className="muted">Email:</span> {activeSnapshot.email || "-"}</p>
              <p><span className="muted">Plan:</span> {activeSnapshot.planName}</p>
              <p><span className="muted">Used Slots:</span> {activeSnapshot.usedSlots}</p>
              <p><span className="muted">Used Rent Slots:</span> {activeSnapshot.usedRentSlots}</p>
              <p><span className="muted">Used Sale Slots:</span> {activeSnapshot.usedSaleSlots}</p>
              <p><span className="muted">Rent Limit:</span> {activeSnapshot.rentSlots}</p>
              <p><span className="muted">Sale Limit:</span> {activeSnapshot.saleSlots}</p>
              <p><span className="muted">Total Slots:</span> {activeSnapshot.totalSlots}</p>
              <p><span className="muted">Remaining Slots:</span> {activeSnapshot.remainingSlots}</p>
              <p><span className="muted">Remaining Rent Slots:</span> {activeSnapshot.remainingRentSlots}</p>
              <p><span className="muted">Remaining Sale Slots:</span> {activeSnapshot.remainingSaleSlots}</p>
            </div>
            <div className="panel p-3">
              <p className="text-xs muted">Utilization</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(
                      Math.round((activeSnapshot.usedSlots / Math.max(activeSnapshot.totalSlots, 1)) * 100),
                      100
                    )}%`,
                    background: "var(--primary)",
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}
      </DetailSidebar>
    </section>
  );
}
