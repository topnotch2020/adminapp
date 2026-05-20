"use client";

import { useToast } from "@/components/providers/toast-provider";
import { addressAreasApi, type AddressAreaRecord } from "@/lib/api/modules/addressAreas";
import { getApiErrorMessage } from "@/lib/admin-auth";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

export function AddressAreasManager() {
  const { showToast } = useToast();
  const [areas, setAreas] = useState<AddressAreaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadAreas = useCallback(async () => {
    setLoading(true);
    try {
      const items = await addressAreasApi.list();
      setAreas(items);
    } catch (error) {
      showToast({
        type: "error",
        title: "Unable to load areas",
        description: getApiErrorMessage(error, "Check API connectivity and admin permissions."),
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadAreas();
  }, [loadAreas]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return areas;
    return areas.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.region.toLowerCase().includes(q)
    );
  }, [areas, search]);

  const submitNewArea = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const region = String(form.get("region") || "").trim();

    if (!name) {
      showToast({ type: "error", title: "Area name is required" });
      return;
    }

    setSaving(true);
    try {
      await addressAreasApi.create({ name, region: region || undefined });
      event.currentTarget.reset();
      await loadAreas();
      showToast({ type: "success", title: "Area added", description: name });
    } catch (error) {
      showToast({
        type: "error",
        title: "Could not add area",
        description: getApiErrorMessage(error, "Try a different name."),
      });
    } finally {
      setSaving(false);
    }
  };

  const removeArea = async (item: AddressAreaRecord) => {
    if (!window.confirm(`Remove "${item.name}" from the area list?`)) return;

    setDeletingId(item.id);
    try {
      await addressAreasApi.remove(item.id);
      await loadAreas();
      showToast({ type: "success", title: "Area removed", description: item.name });
    } catch (error) {
      showToast({
        type: "error",
        title: "Could not remove area",
        description: getApiErrorMessage(error, "Please try again."),
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Pune Address Areas
          </h3>
          <p className="mt-1 text-sm muted">
            Manage areas shown in the mobile property form. New areas appear after app refresh.
          </p>
        </div>
        <p className="text-sm font-medium">{areas.length} areas</p>
      </div>

      <form className="mt-4 grid gap-3 md:grid-cols-[2fr_1fr_auto]" onSubmit={submitNewArea}>
        <input
          name="name"
          required
          placeholder="Area name (e.g. Hinjewadi Phase 3)"
          className="input"
          disabled={saving}
        />
        <input
          name="region"
          placeholder="Region (optional)"
          className="input"
          disabled={saving}
        />
        <button type="submit" className="btn-primary md:w-fit" disabled={saving}>
          {saving ? "Adding..." : "Add Area"}
        </button>
      </form>

      <input
        className="input mt-4"
        placeholder="Search areas..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {loading ? (
        <p className="mt-4 text-sm muted">Loading areas...</p>
      ) : filtered.length === 0 ? (
        <p className="mt-4 text-sm muted">No areas found.</p>
      ) : (
        <div
          className="mt-4 max-h-[420px] overflow-auto rounded-xl border"
          style={{ borderColor: "var(--border)" }}
        >
          <table className="w-full text-left text-sm">
            <thead
              className="sticky top-0 text-xs uppercase tracking-wide muted"
              style={{ background: "var(--surface-2)" }}
            >
              <tr>
                <th className="px-3 py-2 font-semibold">Area</th>
                <th className="px-3 py-2 font-semibold">Region</th>
                <th className="px-3 py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="border-t"
                  style={{ borderColor: "var(--border)" }}
                >
                  <td className="px-3 py-2.5 font-medium">{item.name}</td>
                  <td className="px-3 py-2.5 muted">{item.region || "—"}</td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      type="button"
                      className="text-xs font-semibold text-rose-600 hover:underline"
                      disabled={deletingId === item.id}
                      onClick={() => void removeArea(item)}
                    >
                      {deletingId === item.id ? "Removing..." : "Remove"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
