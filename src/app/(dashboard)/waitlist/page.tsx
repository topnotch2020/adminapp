"use client";

import { PageHeader } from "@/components/ui/page-header";
import { waitlistApi } from "@/lib/api/modules/waitlist";
import { downloadCsv } from "@/lib/utils/export-csv";
import type { WaitlistEntry } from "@/types/domain";
import { Download, Mail, Plus, RefreshCcw, Search } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";

export default function WaitlistPage() {
  const [items, setItems] = useState<WaitlistEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await waitlistApi.list({ limit: 100, search: search || undefined });
      setItems(result.items);
      setTotal(result.pagination?.total ?? result.items.length);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  const onAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await waitlistApi.add({
      email: String(form.get("email") || ""),
      source: String(form.get("source") || "admin"),
    });
    setShowAdd(false);
    event.currentTarget.reset();
    void load();
  };

  const exportList = () => {
    downloadCsv(
      `waitlist-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Email", "Source", "Created"],
      items.map((row) => [
        row.email,
        row.source || "",
        row.createdAt ? new Date(row.createdAt).toLocaleString() : "",
      ])
    );
  };

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Growth"
        title="Waitlist"
        description="Leads and early-access signups from the website and admin integrations."
        actions={
          <>
            <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={exportList}>
              <Download size={14} />
              Export CSV
            </button>
            <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={() => setShowAdd(true)}>
              <Plus size={14} />
              Add entry
            </button>
          </>
        }
      />

      <div className="panel flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[240px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 muted" />
          <input
            className="input w-full !pl-9"
            placeholder="Search by email or source..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={() => void load()}>
          <RefreshCcw size={14} />
          Refresh
        </button>
        <span className="badge badge-primary">{total} entries</span>
      </div>

      {showAdd ? (
        <form className="panel grid grid-cols-1 gap-3 p-5 md:grid-cols-3" onSubmit={onAdd}>
          <input className="input" name="email" type="email" placeholder="Email" required />
          <input className="input" name="source" placeholder="Source (e.g. website, expo)" />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1">
              Save
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <div className="panel p-5 text-sm muted">Loading waitlist...</div>
      ) : items.length === 0 ? (
        <article className="panel flex flex-col items-center gap-3 p-12 text-center">
          <Mail size={32} className="muted" />
          <p className="font-medium">No waitlist entries yet</p>
          <p className="text-sm muted">Add leads manually or connect your marketing forms.</p>
        </article>
      ) : (
        <div className="panel overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead style={{ background: "var(--surface-2)" }}>
              <tr>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row._id} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3 font-medium">{row.email}</td>
                  <td className="px-4 py-3">
                    <span className="badge badge-primary">{row.source || "unknown"}</span>
                  </td>
                  <td className="px-4 py-3 muted">
                    {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
