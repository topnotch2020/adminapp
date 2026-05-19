"use client";

import { brokersApi } from "@/lib/api/modules/brokers";
import { DetailSidebar } from "@/components/ui/detail-sidebar";
import { useToast } from "@/components/providers/toast-provider";
import { Broker } from "@/types/domain";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function BrokersPage() {
  const { showToast } = useToast();
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"ALL" | "BROKER" | "ADMIN">("ALL");
  const [status, setStatus] = useState<
    "ALL" | "PENDING_VERIFICATION" | "VERIFIED" | "SUSPENDED" | "BLOCKED"
  >("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selected, setSelected] = useState<string[]>([]);
  const [activeBrokerId, setActiveBrokerId] = useState<string | null>(null);

  const loadBrokers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await brokersApi.list({
        limit: 100,
        search: search || undefined,
        role: role === "ALL" ? undefined : role,
        status: status === "ALL" ? undefined : status,
      });
      setBrokers(result.items);
      setSelected([]);
      setPage(1);
    } catch {
      showToast({
        type: "error",
        title: "Unable to load brokers",
        description: "Please retry or check API connectivity.",
      });
    } finally {
      setLoading(false);
    }
  }, [role, search, showToast, status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBrokers();
  }, [loadBrokers]);

  const filteredCountLabel = useMemo(() => `${brokers.length} broker records`, [brokers.length]);
  const totalPages = Math.max(1, Math.ceil(brokers.length / pageSize));
  const pagedBrokers = useMemo(
    () => brokers.slice((page - 1) * pageSize, page * pageSize),
    [brokers, page]
  );
  const activeBroker = useMemo(
    () => brokers.find((broker) => broker._id === activeBrokerId) || null,
    [activeBrokerId, brokers]
  );
  const verifiedCount = brokers.filter((item) => item.status === "VERIFIED").length;
  const suspendedCount = brokers.filter((item) => item.status === "SUSPENDED").length;
  const adminCount = brokers.filter((item) => item.role === "ADMIN").length;

  const onRoleChange = async (brokerId: string, nextRole: "BROKER" | "ADMIN") => {
    setSaving(brokerId);
    try {
      const updated = await brokersApi.updateRole(brokerId, nextRole);
      setBrokers((prev) => prev.map((broker) => (broker._id === brokerId ? updated : broker)));
      showToast({ type: "success", title: "Broker role updated" });
    } catch {
      showToast({ type: "error", title: "Failed to update role" });
    } finally {
      setSaving(null);
    }
  };

  const onStatusChange = async (
    brokerId: string,
    nextStatus: "PENDING_VERIFICATION" | "VERIFIED" | "SUSPENDED" | "BLOCKED"
  ) => {
    setSaving(brokerId);
    try {
      const updated = await brokersApi.updateStatus(brokerId, nextStatus);
      setBrokers((prev) => prev.map((broker) => (broker._id === brokerId ? updated : broker)));
      showToast({ type: "success", title: "Broker status updated" });
    } catch {
      showToast({ type: "error", title: "Failed to update status" });
    } finally {
      setSaving(null);
    }
  };

  const toggleSelectAll = () => {
    const visibleIds = pagedBrokers.map((broker) => broker._id);
    const allSelected = visibleIds.every((id) => selected.includes(id));
    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelected((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const bulkUpdateStatus = async (
    nextStatus: "PENDING_VERIFICATION" | "VERIFIED" | "SUSPENDED" | "BLOCKED"
  ) => {
    if (selected.length === 0) return;
    setSaving("bulk");
    try {
      await Promise.all(selected.map((id) => brokersApi.updateStatus(id, nextStatus)));
      await loadBrokers();
      showToast({ type: "success", title: `Bulk status updated (${selected.length})` });
    } catch {
      showToast({ type: "error", title: "Bulk update failed" });
    } finally {
      setSaving(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="panel p-4">
          <p className="text-xs muted">Verified Brokers</p>
          <p className="mt-1 text-xl font-semibold">{verifiedCount}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs muted">Suspended Brokers</p>
          <p className="mt-1 text-xl font-semibold">{suspendedCount}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs muted">Admin Accounts</p>
          <p className="mt-1 text-xl font-semibold">{adminCount}</p>
        </div>
      </div>
      <div className="panel p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            className="input md:col-span-2"
            placeholder="Search by name, email, phone"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="input"
            value={role}
            onChange={(event) => setRole(event.target.value as typeof role)}
          >
            <option value="ALL">All roles</option>
            <option value="BROKER">BROKER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <select
            className="input"
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="BLOCKED">BLOCKED</option>
          </select>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs muted">{filteredCountLabel}</p>
          <div className="flex items-center gap-2">
            <button className="btn-secondary" onClick={() => void bulkUpdateStatus("VERIFIED")} disabled={saving === "bulk" || selected.length === 0}>
              Mark Verified ({selected.length})
            </button>
            <button className="btn-secondary" onClick={() => void bulkUpdateStatus("SUSPENDED")} disabled={saving === "bulk" || selected.length === 0}>
              Suspend Selected
            </button>
            <button className="btn-primary" onClick={() => void loadBrokers()}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>
      <div className="panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead style={{ background: "var(--surface-2)" }} className="muted">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={pagedBrokers.length > 0 && pagedBrokers.every((b) => selected.includes(b._id))}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 muted" colSpan={8}>
                  Loading brokers...
                </td>
              </tr>
            ) : brokers.length === 0 ? (
              <tr>
                <td className="px-4 py-6 muted" colSpan={8}>
                  No brokers found
                </td>
              </tr>
            ) : (
              pagedBrokers.map((broker) => (
                <tr key={broker._id} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(broker._id)}
                      onChange={(event) =>
                        setSelected((prev) =>
                          event.target.checked
                            ? [...prev, broker._id]
                            : prev.filter((id) => id !== broker._id)
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    {broker.fname} {broker.lname}
                  </td>
                  <td className="px-4 py-3">{broker.email}</td>
                  <td className="px-4 py-3">{broker.phone || "-"}</td>
                  <td className="px-4 py-3">
                    <select
                      className="input !py-1"
                      disabled={saving === broker._id}
                      value={broker.role || "BROKER"}
                      onChange={(event) =>
                        void onRoleChange(
                          broker._id,
                          event.target.value as "BROKER" | "ADMIN"
                        )
                      }
                    >
                      <option value="BROKER">BROKER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="input !py-1"
                      disabled={saving === broker._id}
                      value={broker.status || "PENDING_VERIFICATION"}
                      onChange={(event) =>
                        void onStatusChange(
                          broker._id,
                          event.target.value as
                            | "PENDING_VERIFICATION"
                            | "VERIFIED"
                            | "SUSPENDED"
                            | "BLOCKED"
                        )
                      }
                    >
                      <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                      <option value="VERIFIED">VERIFIED</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                      <option value="BLOCKED">BLOCKED</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {broker.createdAt
                      ? new Date(broker.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <button className="btn-secondary !py-1" onClick={() => setActiveBrokerId(broker._id)}>
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm" style={{ borderColor: "var(--border)" }}>
          <p className="muted">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              className="btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            <button
              className="btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      <DetailSidebar
        open={Boolean(activeBroker)}
        title="Broker Detail View"
        subtitle={activeBroker ? `${activeBroker.fname} ${activeBroker.lname}` : undefined}
        onClose={() => setActiveBrokerId(null)}
        widthClassName="max-w-xl"
      >
        {activeBroker ? (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <p><span className="muted">Name:</span> {activeBroker.fname} {activeBroker.lname}</p>
              <p><span className="muted">Email:</span> {activeBroker.email}</p>
              <p><span className="muted">Phone:</span> {activeBroker.phone || "-"}</p>
              <p><span className="muted">Role:</span> {activeBroker.role || "BROKER"}</p>
              <p><span className="muted">Status:</span> {activeBroker.status || "-"}</p>
              <p><span className="muted">Created:</span> {activeBroker.createdAt ? new Date(activeBroker.createdAt).toLocaleString() : "-"}</p>
            </div>
            <div className="panel p-4">
              <p className="text-xs muted">Quick Actions</p>
              <div className="mt-2 flex gap-2">
                <button
                  className="btn-secondary !py-1"
                  onClick={() => void onStatusChange(activeBroker._id, "VERIFIED")}
                  disabled={saving === activeBroker._id}
                >
                  Verify
                </button>
                <button
                  className="btn-secondary !py-1"
                  onClick={() => void onStatusChange(activeBroker._id, "SUSPENDED")}
                  disabled={saving === activeBroker._id}
                >
                  Suspend
                </button>
                <button
                  className="btn-secondary !py-1"
                  onClick={() => void onRoleChange(activeBroker._id, activeBroker.role === "ADMIN" ? "BROKER" : "ADMIN")}
                  disabled={saving === activeBroker._id}
                >
                  Toggle Role
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </DetailSidebar>
    </section>
  );
}
