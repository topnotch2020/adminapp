"use client";

import { propertiesApi } from "@/lib/api/modules/properties";
import { useToast } from "@/components/providers/toast-provider";
import { DetailSidebar } from "@/components/ui/detail-sidebar";
import { Property } from "@/types/domain";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function PropertiesPage() {
  const { showToast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [listingType, setListingType] = useState<"ALL" | "RENT" | "SALE">("ALL");
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [brokerId, setBrokerId] = useState("");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);

  const loadProperties = useCallback(async () => {
    setLoading(true);
    try {
      const response = await propertiesApi.list({
        limit: 100,
        listingType: listingType === "ALL" ? undefined : listingType,
        status: status === "ALL" ? undefined : status,
        search: search || undefined,
        brokerId: brokerId || undefined,
      });
      setProperties(response.items ?? []);
      setPage(1);
    } catch {
      showToast({ type: "error", title: "Unable to load properties" });
    } finally {
      setLoading(false);
    }
  }, [brokerId, listingType, search, showToast, status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProperties();
  }, [loadProperties]);

  const moderate = async (property: Property, action: "VERIFY" | "REJECT") => {
    const id = property.id || property._id;
    if (!id) return;
    const reason =
      action === "REJECT"
        ? window.prompt("Reason for rejection (optional)") || undefined
        : undefined;
    setActioning(id);
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
  const verifiedCount = properties.filter((item) => item.status === "VERIFIED").length;
  const unverifiedCount = properties.filter((item) => item.status === "UNVERIFIED").length;

  return (
    <section className="space-y-4">
      <h2 className="panel-title">Properties</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="panel p-4">
          <p className="text-xs muted">Total</p>
          <p className="mt-1 text-xl font-semibold">{properties.length}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs muted">Verified</p>
          <p className="mt-1 text-xl font-semibold">{verifiedCount}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs muted">Pending Moderation</p>
          <p className="mt-1 text-xl font-semibold">{unverifiedCount}</p>
        </div>
      </div>
      <div className="panel p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <input
            className="input md:col-span-2"
            placeholder="Search by project/area/city"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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
          </select>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs muted">{properties.length} properties found</p>
          <div className="flex gap-2">
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
                setStatus("ALL");
                setListingType("ALL");
                setBrokerId("");
              }}
            >
              Clear
            </button>
          <button className="btn-primary" onClick={() => void loadProperties()}>
            Refresh
          </button>
          </div>
        </div>
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
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="rounded-full px-2 py-1" style={{ background: "var(--surface-2)" }}>
                  {property.status || "UNKNOWN"}
                </span>
                <span className="font-medium">
                  {property.pricing?.formattedPrice
                    ? `INR ${property.pricing.formattedPrice}`
                    : property.pricing?.price
                    ? `INR ${property.pricing.price}`
                    : "-"}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  className="btn-primary"
                  disabled={actioning === (property.id || property._id)}
                  onClick={() => void moderate(property, "VERIFY")}
                >
                  Verify
                </button>
                <button
                  className="btn-secondary"
                  disabled={actioning === (property.id || property._id)}
                  onClick={() => void moderate(property, "REJECT")}
                >
                  Reject
                </button>
                <button className="btn-secondary" onClick={() => setActivePropertyId(property.id || property._id || null)}>
                  View Details
                </button>
              </div>
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
                  <td className="px-4 py-3">
                    {property.pricing?.formattedPrice
                      ? `INR ${property.pricing.formattedPrice}`
                      : property.pricing?.price
                      ? `INR ${property.pricing.price}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="btn-primary" onClick={() => void moderate(property, "VERIFY")}>
                        Verify
                      </button>
                      <button className="btn-secondary" onClick={() => void moderate(property, "REJECT")}>
                        Reject
                      </button>
                      <button className="btn-secondary" onClick={() => setActivePropertyId(property.id || property._id || null)}>
                        View
                      </button>
                    </div>
                  </td>
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
          </>
        ) : null}
      </DetailSidebar>
    </section>
  );
}
