"use client";

import { systemApi } from "@/lib/api/modules/system";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuditLog } from "@/types/domain";

export default function AuditPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AuditLog[]>([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const limit = 25;

  const load = useCallback(async (nextSkip = skip) => {
    setLoading(true);
    try {
      const result = await systemApi.auditLogs({ limit, skip: nextSkip });
      setItems(result.items);
      setHasMore(Boolean(result.pagination?.hasMore));
    } finally {
      setLoading(false);
    }
  }, [skip]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(0);
  }, [load]);

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const q = search.toLowerCase();
        return (
          item.event.toLowerCase().includes(q) ||
          item.message.toLowerCase().includes(q) ||
          (item.actor || "").toLowerCase().includes(q) ||
          (item.target || "").toLowerCase().includes(q)
        );
      }),
    [items, search]
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="panel-title">Audit Logs</h2>
          <p className="text-sm muted">Trace admin actions and system events.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="input !py-1.5"
            placeholder="Filter logs"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button className="btn-secondary" onClick={() => void load()}>
            Refresh
          </button>
        </div>
      </div>
      <div className="panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="muted" style={{ background: "var(--surface-2)" }}>
            <tr>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 muted">
                  Loading audit logs...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 muted">
                  No logs found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3 font-medium">{item.event}</td>
                  <td className="px-4 py-3">{item.message}</td>
                  <td className="px-4 py-3">{item.actor || "-"}</td>
                  <td className="px-4 py-3">{item.target || "-"}</td>
                  <td className="px-4 py-3">{new Date(item.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-end gap-2 border-t px-4 py-3" style={{ borderColor: "var(--border)" }}>
          <button
            className="btn-secondary"
            disabled={skip === 0}
            onClick={() => {
              const nextSkip = Math.max(skip - limit, 0);
              setSkip(nextSkip);
              void load(nextSkip);
            }}
          >
            Previous
          </button>
          <button
            className="btn-secondary"
            disabled={!hasMore}
            onClick={() => {
              const nextSkip = skip + limit;
              setSkip(nextSkip);
              void load(nextSkip);
            }}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
