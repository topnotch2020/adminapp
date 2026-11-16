"use client";

import { brokersApi } from "@/lib/api/modules/brokers";
import { useToast } from "@/components/providers/toast-provider";
import { IconButton } from "@/components/ui/icon-button";
import { BrokerAvatar } from "@/components/brokers/broker-avatar";
import {
  RoleSelect,
  StatusSelect,
  useBrokerControls,
  type BrokerStatusValue,
} from "@/components/brokers/broker-controls";
import { BROKER_STATUS, brokerStatus, formatDate } from "@/lib/labels";
import { Broker } from "@/types/domain";
import { ChevronLeft, ChevronRight, ChevronRight as Open, RefreshCcw, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 10;

export default function BrokersPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"ALL" | "BROKER" | "ADMIN">("ALL");
  const [status, setStatus] = useState<"ALL" | BrokerStatusValue>("ALL");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  const loadBrokers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await brokersApi.list({
        limit: 100,
        search: search.trim() || undefined,
        role: role === "ALL" ? undefined : role,
        status: status === "ALL" ? undefined : status,
      });
      setBrokers(result.items);
      setSelected([]);
      setPage(1);
    } catch {
      showToast({ type: "error", title: "Unable to load brokers", description: "Please retry or check API connectivity." });
    } finally {
      setLoading(false);
    }
  }, [role, search, showToast, status]);

  useEffect(() => {
    // Debounced so typing in search doesn't fire a request per key
    const timer = setTimeout(() => void loadBrokers(), 300);
    return () => clearTimeout(timer);
  }, [loadBrokers]);

  const { changeStatus, changeRole, savingId, dialog, confirm } = useBrokerControls((updated) =>
    setBrokers((prev) => prev.map((broker) => (broker._id === updated._id ? updated : broker)))
  );

  const totalPages = Math.max(1, Math.ceil(brokers.length / PAGE_SIZE));
  const pagedBrokers = useMemo(() => brokers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [brokers, page]);
  const counts = {
    verified: brokers.filter((item) => item.status === "VERIFIED").length,
    pending: brokers.filter((item) => !item.status || item.status === "PENDING_VERIFICATION").length,
    suspended: brokers.filter((item) => item.status === "SUSPENDED" || item.status === "BLOCKED").length,
    admins: brokers.filter((item) => item.role === "ADMIN").length,
  };

  const toggleSelectAll = () => {
    const visibleIds = pagedBrokers.map((broker) => broker._id);
    const allSelected = visibleIds.every((id) => selected.includes(id));
    setSelected((prev) =>
      allSelected ? prev.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...prev, ...visibleIds]))
    );
  };

  const bulkUpdateStatus = async (nextStatus: BrokerStatusValue) => {
    if (selected.length === 0) return;
    const info = brokerStatus(nextStatus);
    const { confirmed } = await confirm({
      title: `Set ${selected.length} account${selected.length === 1 ? "" : "s"} to ${info.label}?`,
      description: "This changes the status of every selected account.",
      confirmLabel: `Set ${info.label}`,
      tone: nextStatus === "SUSPENDED" ? "danger" : "primary",
    });
    if (!confirmed) return;

    setBulkSaving(true);
    try {
      await Promise.all(selected.map((id) => brokersApi.updateStatus(id, nextStatus)));
      await loadBrokers();
      showToast({ type: "success", title: `${selected.length} accounts set to ${info.label}` });
    } catch {
      showToast({ type: "error", title: "Bulk update failed" });
    } finally {
      setBulkSaving(false);
    }
  };

  const tiles = [
    { label: "Verified", value: counts.verified, color: "var(--success)" },
    { label: "Pending verification", value: counts.pending, color: "var(--warning)" },
    { label: "Suspended / blocked", value: counts.suspended, color: "var(--danger)" },
    { label: "Admins", value: counts.admins, color: "var(--primary)" },
  ];

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="panel p-4">
            <p className="text-xs muted">{tile.label}</p>
            <p className="mt-1 text-xl font-semibold" style={{ color: tile.color }}>
              {loading ? "—" : tile.value}
            </p>
          </div>
        ))}
      </div>

      <div className="panel overflow-hidden">
        <div className="space-y-3 border-b p-4" style={{ borderColor: "var(--border)" }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Accounts</h2>
              <p className="text-xs muted">{loading ? "Loading…" : `${brokers.length} accounts`}</p>
            </div>
            <IconButton label="Refresh" icon={<RefreshCcw size={15} />} onClick={() => void loadBrokers()} />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
            <div className="relative sm:col-span-2">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 muted" />
              <input
                className="input w-full pl-9"
                placeholder="Search name, email or phone"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <select className="input w-full" value={role} onChange={(event) => setRole(event.target.value as typeof role)}>
              <option value="ALL">All roles</option>
              <option value="BROKER">Brokers</option>
              <option value="ADMIN">Admins</option>
            </select>
            <select className="input w-full" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
              <option value="ALL">Any status</option>
              {Object.entries(BROKER_STATUS).map(([value, info]) => (
                <option key={value} value={value}>{info.label}</option>
              ))}
            </select>
          </div>
          {selected.length > 0 ? (
            <div
              className="flex flex-wrap items-center gap-2 rounded-xl px-3 py-2 text-sm"
              style={{ background: "var(--sidebar-active)" }}
            >
              <span className="font-medium">{selected.length} selected</span>
              <span className="muted">·</span>
              <button className="btn-secondary !py-1 text-xs" disabled={bulkSaving} onClick={() => void bulkUpdateStatus("VERIFIED")}>
                Mark verified
              </button>
              <button className="btn-secondary !py-1 text-xs" disabled={bulkSaving} onClick={() => void bulkUpdateStatus("SUSPENDED")}>
                Suspend
              </button>
              <button className="ml-auto text-xs muted" onClick={() => setSelected([])}>
                Clear selection
              </button>
            </div>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="data-table min-w-[820px]">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all on this page"
                    checked={pagedBrokers.length > 0 && pagedBrokers.every((b) => selected.includes(b._id))}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Account</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={7}>
                      <div className="flex items-center gap-3">
                        <div className="skeleton h-9 w-9 !rounded-full" />
                        <div className="flex-1 space-y-1.5">
                          <div className="skeleton h-3 w-40" />
                          <div className="skeleton h-2.5 w-56" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : brokers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center muted">
                    No accounts match these filters
                  </td>
                </tr>
              ) : (
                pagedBrokers.map((broker) => (
                  <tr key={broker._id} className="cursor-pointer" onClick={() => router.push(`/brokers/${broker._id}`)}>
                    <td onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${broker.fname}`}
                        checked={selected.includes(broker._id)}
                        onChange={(event) =>
                          setSelected((prev) =>
                            event.target.checked ? [...prev, broker._id] : prev.filter((id) => id !== broker._id)
                          )
                        }
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <BrokerAvatar broker={broker} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{`${broker.fname ?? ""} ${broker.lname ?? ""}`.trim() || "Unnamed"}</p>
                          <p className="max-w-[260px] truncate text-xs muted">{broker.email || "No email"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap">{broker.phone || <span className="muted">—</span>}</td>
                    <td>
                      <RoleSelect
                        broker={broker}
                        disabled={savingId === broker._id}
                        onChange={(next) => void changeRole(broker, next)}
                      />
                    </td>
                    <td>
                      <StatusSelect
                        broker={broker}
                        disabled={savingId === broker._id}
                        onChange={(next) => void changeStatus(broker, next)}
                      />
                    </td>
                    <td className="whitespace-nowrap text-xs muted">{formatDate(broker.createdAt)}</td>
                    <td>
                      <IconButton
                        label="Open profile"
                        icon={<Open size={15} />}
                        onClick={() => router.push(`/brokers/${broker._id}`)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {brokers.length > PAGE_SIZE ? (
          <div className="flex items-center justify-end gap-2 border-t px-4 py-3 text-sm" style={{ borderColor: "var(--border)" }}>
            <p className="muted">
              Page {page} of {totalPages}
            </p>
            <IconButton
              label="Previous page"
              icon={<ChevronLeft size={15} />}
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            />
            <IconButton
              label="Next page"
              icon={<ChevronRight size={15} />}
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            />
          </div>
        ) : null}
      </div>
      {dialog}
    </section>
  );
}
