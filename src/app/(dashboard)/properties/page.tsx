"use client";

import { propertiesApi, type AdminPropertyAction, type PropertyStats } from "@/lib/api/modules/properties";
import { useToast } from "@/components/providers/toast-provider";
import { AreaAutocomplete } from "@/components/ui/area-autocomplete";
import { DetailSidebar } from "@/components/ui/detail-sidebar";
import { Property } from "@/types/domain";
import { useCallback, useEffect, useMemo, useState } from "react";

function daysUntilExpiry(expiresAt?: string): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatExpiry(expiresAt?: string) {
  if (!expiresAt) return "—";
  const days = daysUntilExpiry(expiresAt);
  const date = new Date(expiresAt).toLocaleDateString();
  if (days === null) return date;
  if (days < 0) return `${date} (expired)`;
  if (days === 0) return `${date} (today)`;
  return `${date} (${days}d left)`;
}

export default function PropertiesPage() {
  const { showToast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [listingType, setListingType] = useState<"ALL" | "RENT" | "SALE">("ALL");
  const [status, setStatus] = useState("ALL");
  const [expiringSoonOnly, setExpiringSoonOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [brokerId, setBrokerId] = useState("");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);

  const loadProperties = useCallback(async () => {
    setLoading(true);
    try {
      const [listResponse, statsResponse] = await Promise.all([
        propertiesApi.list({
          limit: 100,
          listingType: listingType === "ALL" ? undefined : listingType,
          status: status === "ALL" ? undefined : status,
          search: [search, areaFilter].filter(Boolean).join(" ").trim() || undefined,
          brokerId: brokerId || undefined,
          expiringSoon: expiringSoonOnly || undefined,
        }),
        propertiesApi.stats(),
      ]);
      setProperties(listResponse.items ?? []);
      setStats(statsResponse);
      setPage(1);
    } catch {
      showToast({ type: "error", title: "Unable to load properties" });
    } finally {
      setLoading(false);
    }
  }, [areaFilter, brokerId, expiringSoonOnly, listingType, search, showToast, status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProperties();
  }, [loadProperties]);

  const runAction = async (
    property: Property,
    action: AdminPropertyAction,
    options?: { reason?: string; extensionDays?: number }
  ) => {
    const id = property.id || property._id;
    if (!id) return;

    const confirmMessages: Partial<Record<AdminPropertyAction, string>> = {
      EXPIRE: "Expire this listing now?",
      MARK_SOLD: "Mark this property as sold?",
      SOFT_DELETE: "Soft-delete this property?",
      RESTORE: "Restore this deleted property?",
      EXTEND: `Extend expiry by ${options?.extensionDays ?? (property.listingType === "SALE" ? 60 : 30)} days?`,
    };
    if (confirmMessages[action] && !window.confirm(confirmMessages[action])) return;

    setActioning(`${id}:${action}`);
    try {
      await propertiesApi.manage(id, action, options);
      await loadProperties();
      showToast({ type: "success", title: `Action completed: ${action}` });
    } catch {
      showToast({ type: "error", title: `Failed: ${action}` });
    } finally {
      setActioning(null);
    }
  };

  const moderate = async (property: Property, action: "VERIFY" | "REJECT") => {
    const id = property.id || property._id;
    if (!id) return;
    const reason =
      action === "REJECT"
        ? window.prompt("Reason for rejection (optional)") || undefined
        : undefined;
    setActioning(`${id}:${action}`);
    try {
      await propertiesApi.verify(id, action, reason);
      await loadProperties();
      showToast({
        type: "success",
        title: action === "VERIFY" ? "Property verified" : "Property rejected",
      });
    } catch {
      showToast({ type: "error", title: "Property moderation failed" });
    } finally {
      setActioning(null);
    }
  };

  const paged = properties.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(properties.length / pageSize));
  const activeProperty =
    properties.find((item) => (item.id || item._id) === activePropertyId) || null;
  const propertyImages = useMemo(() => {
    if (!activeProperty?.images?.length) return [];
    return activeProperty.images
      .map((img) => img?.url)
      .filter((img): img is string => Boolean(img));
  }, [activeProperty]);
  const activeBroker = useMemo(() => {
    if (!activeProperty) return null;
    if (activeProperty.broker) return activeProperty.broker;
    if (typeof activeProperty.brokerId === "object") {
      return {
        name: `${activeProperty.brokerId.fname || ""} ${activeProperty.brokerId.lname || ""}`.trim(),
        email: activeProperty.brokerId.email,
        phone: activeProperty.brokerId.phone,
      };
    }
    return null;
  }, [activeProperty]);

  const renderActions = (property: Property, compact = false) => (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "mt-4"}`}>
      {property.status === "UNVERIFIED" && (
        <>
          <button
            className="btn-primary"
            disabled={Boolean(actioning)}
            onClick={() => void moderate(property, "VERIFY")}
          >
            Verify
          </button>
          <button
            className="btn-secondary"
            disabled={Boolean(actioning)}
            onClick={() => void moderate(property, "REJECT")}
          >
            Reject
          </button>
        </>
      )}
      {property.status === "VERIFIED" && (
        <>
          <button
            className="btn-secondary"
            disabled={Boolean(actioning)}
            onClick={() =>
              void runAction(property, "EXTEND", {
                extensionDays: property.listingType === "SALE" ? 60 : 30,
              })
            }
          >
            Extend
          </button>
          <button
            className="btn-secondary"
            disabled={Boolean(actioning)}
            onClick={() => void runAction(property, "EXPIRE")}
          >
            Expire
          </button>
          <button
            className="btn-secondary"
            disabled={Boolean(actioning)}
            onClick={() => void runAction(property, "MARK_SOLD")}
          >
            Mark Sold
          </button>
        </>
      )}
      {property.status === "EXPIRED" && (
        <button
          className="btn-primary"
          disabled={Boolean(actioning)}
          onClick={() =>
            void runAction(property, "EXTEND", {
              extensionDays: property.listingType === "SALE" ? 60 : 30,
            })
          }
        >
          Reactivate
        </button>
      )}
      <button
        className="btn-secondary"
        disabled={Boolean(actioning)}
        onClick={() => void runAction(property, "SOFT_DELETE")}
      >
        Delete
      </button>
      <button
        className="btn-secondary"
        onClick={() => setActivePropertyId(property.id || property._id || null)}
      >
        {compact ? "View" : "View Details"}
      </button>
    </div>
  );

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <div className="panel p-4">
          <p className="text-xs muted">Total</p>
          <p className="mt-1 text-xl font-semibold">{stats?.total ?? properties.length}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs muted">Pending</p>
          <p className="mt-1 text-xl font-semibold">{stats?.unverified ?? "—"}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs muted">Active</p>
          <p className="mt-1 text-xl font-semibold">{stats?.verified ?? "—"}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs muted">Expiring Soon</p>
          <p className="mt-1 text-xl font-semibold text-amber-600">{stats?.expiringSoon ?? "—"}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs muted">Expired</p>
          <p className="mt-1 text-xl font-semibold">{stats?.expired ?? "—"}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs muted">Auto-expiry</p>
          <p className="mt-1 text-sm font-medium">
            Rent {stats?.listingExpiryDays?.RENT ?? 30}d · Sale {stats?.listingExpiryDays?.SALE ?? 60}d
          </p>
        </div>
      </div>
      <div className="panel p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <input
            className="input md:col-span-2"
            placeholder="Search by project/area/city"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <AreaAutocomplete
            value={areaFilter}
            onChange={setAreaFilter}
            placeholder="Filter by area (Pune)"
          />
          <input
            className="input"
            placeholder="Filter by brokerId"
            value={brokerId}
            onChange={(event) => setBrokerId(event.target.value)}
          />
          <select
            className="input"
            value={listingType}
            onChange={(event) => setListingType(event.target.value as typeof listingType)}
          >
            <option value="ALL">All listing types</option>
            <option value="RENT">RENT</option>
            <option value="SALE">SALE</option>
          </select>
          <select className="input" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="ALL">All statuses</option>
            <option value="UNVERIFIED">UNVERIFIED</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="SOLD">SOLD</option>
            <option value="DRAFTED">DRAFTED</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={expiringSoonOnly}
              onChange={(event) => setExpiringSoonOnly(event.target.checked)}
            />
            Expiring within 2 days only
          </label>
          <div className="flex flex-wrap gap-2">
            <button className={`btn-secondary ${view === "cards" ? "opacity-100" : "opacity-70"}`} onClick={() => setView("cards")}>
              Cards
            </button>
            <button className={`btn-secondary ${view === "table" ? "opacity-100" : "opacity-70"}`} onClick={() => setView("table")}>
              Table
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setSearch("");
                setAreaFilter("");
                setStatus("ALL");
                setListingType("ALL");
                setBrokerId("");
                setExpiringSoonOnly(false);
              }}
            >
              Clear
            </button>
            <button className="btn-primary" onClick={() => void loadProperties()}>
              Refresh
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs muted">{properties.length} properties in current view</p>
      </div>
      {view === "cards" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {loading ? (
            <div className="panel p-5 text-sm muted">Loading properties...</div>
          ) : properties.length === 0 ? (
            <div className="panel p-5 text-sm muted">No properties found.</div>
          ) : (
            paged.map((property) => (
              <article key={property.id || property._id} className="panel p-5">
                <h3 className="text-base font-semibold">
                  {property.bhkType}{" "}
                  {typeof property.propertyType === "string"
                    ? property.propertyType
                    : property.propertyType?.label}
                </h3>
                <p className="mt-1 text-sm muted">
                  {property.address?.projectName}, {property.address?.areaName},{" "}
                  {property.address?.city}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="rounded-full px-2 py-1" style={{ background: "var(--surface-2)" }}>
                    {property.status || "UNKNOWN"} · {property.listingType}
                  </span>
                  <span className="text-xs muted">{formatExpiry(property.expiresAt)}</span>
                  <span className="font-medium">
                    {property.pricing?.formattedPrice
                      ? `INR ${property.pricing.formattedPrice}`
                      : property.pricing?.price
                      ? `INR ${property.pricing.price}`
                      : "-"}
                  </span>
                </div>
                {renderActions(property)}
              </article>
            ))
          )}
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead style={{ background: "var(--surface-2)" }} className="muted">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((property) => (
                <tr key={property.id || property._id} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3">
                    {property.bhkType}{" "}
                    {typeof property.propertyType === "string"
                      ? property.propertyType
                      : property.propertyType?.label}
                  </td>
                  <td className="px-4 py-3">
                    {property.address?.projectName}, {property.address?.city}
                  </td>
                  <td className="px-4 py-3">{property.listingType}</td>
                  <td className="px-4 py-3">{property.status}</td>
                  <td className="px-4 py-3 text-xs">{formatExpiry(property.expiresAt)}</td>
                  <td className="px-4 py-3">
                    {property.pricing?.formattedPrice
                      ? `INR ${property.pricing.formattedPrice}`
                      : property.pricing?.price
                      ? `INR ${property.pricing.price}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3">{renderActions(property, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
          Previous
        </button>
        <p className="text-sm muted">
          Page {page} / {totalPages}
        </p>
        <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>
          Next
        </button>
      </div>
      <DetailSidebar
        open={Boolean(activeProperty)}
        title="Property Detail View"
        subtitle={
          activeProperty
            ? `${activeProperty.address?.projectName || "Untitled"} / ${activeProperty.address?.city || "-"}`
            : undefined
        }
        onClose={() => setActivePropertyId(null)}
      >
        {activeProperty ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              {propertyImages.length === 0 ? (
                <div className="panel col-span-2 p-4 text-sm muted">No photos available for this property.</div>
              ) : (
                propertyImages.map((image, index) => (
                  <div key={image} className={index === 0 ? "col-span-2" : ""}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={`property-${index + 1}`}
                      className="h-44 w-full rounded-xl object-cover"
                    />
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <p><span className="muted">Listing:</span> {activeProperty.listingType || "-"}</p>
              <p><span className="muted">Status:</span> {activeProperty.status || "-"}</p>
              <p><span className="muted">Expires:</span> {formatExpiry(activeProperty.expiresAt)}</p>
              <p><span className="muted">Property Type:</span> {typeof activeProperty.propertyType === "string" ? activeProperty.propertyType : activeProperty.propertyType?.label || "-"}</p>
              <p><span className="muted">BHK:</span> {activeProperty.bhkType || "-"}</p>
              <p><span className="muted">Price:</span> {activeProperty.pricing?.formattedPrice || activeProperty.pricing?.price || "-"}</p>
              <p><span className="muted">Facing:</span> {activeProperty.facing || "-"}</p>
              <p><span className="muted">Project:</span> {activeProperty.address?.projectName || "-"}</p>
              <p><span className="muted">Area:</span> {activeProperty.address?.areaName || "-"}</p>
              <p><span className="muted">Sub Area:</span> {activeProperty.address?.subArea || "-"}</p>
              <p><span className="muted">City:</span> {activeProperty.address?.city || "-"}</p>
              <p><span className="muted">Pincode:</span> {activeProperty.address?.pincode || "-"}</p>
              <p><span className="muted">Available From:</span> {activeProperty.availableFrom ? new Date(activeProperty.availableFrom).toLocaleDateString() : "-"}</p>
              <p><span className="muted">Broker:</span> {activeBroker?.name || "-"}</p>
              <p><span className="muted">Broker Email:</span> {activeBroker?.email || "-"}</p>
              <p><span className="muted">Broker Phone:</span> {activeBroker?.phone || "-"}</p>
              <p><span className="muted">Updated:</span> {activeProperty.updatedAt ? new Date(activeProperty.updatedAt).toLocaleString() : "-"}</p>
              <div className="md:col-span-2">
                <p className="muted">Amenities</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(activeProperty.amenities || []).length === 0 ? (
                    <span className="text-sm muted">No amenities listed</span>
                  ) : (
                    activeProperty.amenities?.map((amenity) => (
                      <span key={amenity} className="rounded-full px-2 py-1 text-xs" style={{ background: "var(--surface-2)" }}>
                        {amenity}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <p className="mb-2 text-sm font-medium">Admin actions</p>
              {renderActions(activeProperty)}
            </div>
          </>
        ) : null}
      </DetailSidebar>
    </section>
  );
}
