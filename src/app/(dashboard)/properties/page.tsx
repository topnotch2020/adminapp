"use client";

import { propertiesApi, type PropertyStats } from "@/lib/api/modules/properties";
import { useToast } from "@/components/providers/toast-provider";
import { AreaAutocomplete } from "@/components/ui/area-autocomplete";
import { Chip } from "@/components/ui/chip";
import { DetailSidebar } from "@/components/ui/detail-sidebar";
import { IconButton } from "@/components/ui/icon-button";
import { CreatePropertyForm } from "@/components/properties/create-property-form";
import { PostedByChip, PropertyDetail } from "@/components/properties/property-detail";
import { usePropertyActions } from "@/components/properties/property-actions";
import { PropertyImage } from "@/components/properties/property-image";
import {
  PROPERTY_STATUS,
  brokerOf,
  coverImage,
  daysUntil,
  expiryText,
  formatDate,
  formatPrice,
  listingType as listingTypeInfo,
  propertyAddress,
  propertyStatus,
  propertyTitle,
} from "@/lib/labels";
import type { Property } from "@/types/domain";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  LayoutGrid,
  List,
  MapPin,
  Plus,
  RefreshCcw,
  Search,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const PAGE_SIZE = 12;
const idOf = (property: Property) => property.id || property._id || "";

export default function PropertiesPage() {
  const { showToast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [listingType, setListingType] = useState<"ALL" | "RENT" | "SALE">("ALL");
  const [status, setStatus] = useState("ALL");
  const [expiringSoonOnly, setExpiringSoonOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [brokerId, setBrokerId] = useState("");
  const [postedBy, setPostedBy] = useState<"ALL" | "BROKER" | "ADMIN">("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [view, setView] = useState<"cards" | "table">("cards");
  const [page, setPage] = useState(1);
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
          brokerId: brokerId.trim() || undefined,
          expiringSoon: expiringSoonOnly || undefined,
          postedBy: postedBy === "ALL" ? undefined : postedBy,
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
  }, [areaFilter, brokerId, expiringSoonOnly, listingType, postedBy, search, showToast, status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProperties();
  }, [loadProperties]);

  const { iconActions, fullActions, dialog } = usePropertyActions(loadProperties);

  const paged = properties.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(properties.length / PAGE_SIZE));
  const activeProperty = properties.find((item) => idOf(item) === activePropertyId) || null;
  const hasFilters =
    Boolean(search || areaFilter || brokerId) ||
    status !== "ALL" ||
    listingType !== "ALL" ||
    postedBy !== "ALL" ||
    expiringSoonOnly;

  const clearFilters = () => {
    setSearch("");
    setAreaFilter("");
    setStatus("ALL");
    setListingType("ALL");
    setBrokerId("");
    setPostedBy("ALL");
    setExpiringSoonOnly(false);
  };

  const statTiles = [
    { label: "Total", value: stats?.total ?? properties.length },
    { label: "Pending review", value: stats?.unverified, tone: "var(--warning)" },
    { label: "Live", value: stats?.verified, tone: "var(--success)" },
    { label: "Expiring soon", value: stats?.expiringSoon, tone: "var(--warning)" },
    { label: "Expired", value: stats?.expired, tone: "var(--danger)" },
    {
      label: "Auto-expiry",
      value: `${stats?.listingExpiryDays?.RENT ?? 30}d / ${stats?.listingExpiryDays?.SALE ?? 60}d`,
      hint: "Rent / Sale",
    },
  ];

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {statTiles.map((tile) => (
          <div key={tile.label} className="panel p-4">
            <p className="text-xs muted">{tile.label}</p>
            <p className="mt-1 text-xl font-semibold" style={tile.tone ? { color: tile.tone } : undefined}>
              {tile.value ?? "—"}
            </p>
            {tile.hint ? <p className="text-[11px] muted">{tile.hint}</p> : null}
          </div>
        ))}
      </div>

      <div className="panel space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Properties</h2>
            <p className="text-xs muted">{loading ? "Loading…" : `${properties.length} in current view`}</p>
          </div>
          <div className="flex items-center gap-2">
            <IconButton label="Refresh" icon={<RefreshCcw size={15} />} onClick={() => void loadProperties()} />
            <div className="inline-flex rounded-lg border p-0.5" style={{ borderColor: "var(--border)" }}>
              {(
                [
                  ["cards", <LayoutGrid key="g" size={15} />, "Card view"],
                  ["table", <List key="l" size={15} />, "Table view"],
                ] as const
              ).map(([key, icon, title]) => (
                <button
                  key={key}
                  type="button"
                  title={title}
                  aria-label={title}
                  onClick={() => setView(key)}
                  className="inline-flex h-7 w-8 items-center justify-center rounded-md transition"
                  style={{
                    background: view === key ? "var(--sidebar-active)" : "transparent",
                    color: view === key ? "var(--primary)" : "var(--muted)",
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
            <button className="btn-primary inline-flex items-center gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> New property
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative sm:col-span-2">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 muted" />
            <input
              className="input w-full pl-9"
              placeholder="Search project, area or city"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <AreaAutocomplete value={areaFilter} onChange={setAreaFilter} placeholder="Area" className="input w-full" />
          <select className="input w-full" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="ALL">Any status</option>
            {Object.entries(PROPERTY_STATUS).map(([value, info]) => (
              <option key={value} value={value}>{info.label}</option>
            ))}
          </select>
          <select
            className="input w-full"
            value={listingType}
            onChange={(event) => setListingType(event.target.value as typeof listingType)}
          >
            <option value="ALL">Rent & sale</option>
            <option value="RENT">For rent</option>
            <option value="SALE">For sale</option>
          </select>
          <select
            className="input w-full"
            value={postedBy}
            onChange={(event) => setPostedBy(event.target.value as typeof postedBy)}
          >
            <option value="ALL">Posted by anyone</option>
            <option value="BROKER">Posted by broker</option>
            <option value="ADMIN">Posted by admin</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setExpiringSoonOnly((value) => !value)}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition"
            style={{
              borderColor: expiringSoonOnly ? "var(--warning)" : "var(--border)",
              background: expiringSoonOnly ? "color-mix(in srgb, var(--warning) 12%, transparent)" : "transparent",
              color: expiringSoonOnly ? "var(--warning)" : "var(--muted)",
            }}
          >
            <Clock size={12} /> Expiring in 2 days
          </button>
          <input
            className="input !py-1 w-56 text-xs"
            placeholder="Broker ID"
            value={brokerId}
            onChange={(event) => setBrokerId(event.target.value)}
          />
          {hasFilters ? (
            <button type="button" className="text-xs font-medium" style={{ color: "var(--primary)" }} onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="panel overflow-hidden">
              <div className="skeleton h-48 !rounded-none" />
              <div className="space-y-2 p-4">
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="panel flex flex-col items-center gap-2 p-10 text-center">
          <p className="font-medium">No properties found</p>
          <p className="text-sm muted">{hasFilters ? "Try clearing the filters." : "Listings appear here once posted."}</p>
        </div>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {paged.map((property) => (
            <PropertyCard
              key={idOf(property)}
              property={property}
              onOpen={() => setActivePropertyId(idOf(property))}
              actions={iconActions(property)}
            />
          ))}
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="data-table min-w-[900px]">
            <thead>
              <tr>
                <th>Property</th>
                <th>Status</th>
                <th>Broker</th>
                <th>Price</th>
                <th>Expires</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((property) => {
                const statusInfo = propertyStatus(property.status);
                const typeInfo = listingTypeInfo(property.listingType);
                const broker = brokerOf(property);
                const cover = coverImage(property);
                return (
                  <tr key={idOf(property)} className="cursor-pointer" onClick={() => setActivePropertyId(idOf(property))}>
                    <td>
                      <div className="flex items-center gap-3">
                        <PropertyImage
                          url={cover}
                          alt=""
                          variant="thumb"
                          rounded="rounded-lg"
                          className="h-10 w-14"
                          width={112}
                          height={80}
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{propertyTitle(property)}</p>
                          <p className="max-w-[260px] truncate text-xs muted">{propertyAddress(property)}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        <Chip tone={statusInfo.tone}>{statusInfo.label}</Chip>
                        <Chip tone={typeInfo.tone} dot={false}>{typeInfo.label}</Chip>
                        <PostedByChip property={property} />
                      </div>
                    </td>
                    <td className="max-w-[160px] truncate">{broker?.name || "—"}</td>
                    <td className="whitespace-nowrap font-medium">{formatPrice(property)}</td>
                    <td className="whitespace-nowrap text-xs">
                      <ExpiryLabel expiresAt={property.expiresAt} />
                    </td>
                    <td>
                      <div className="flex justify-end">{iconActions(property)}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && properties.length > PAGE_SIZE ? (
        <div className="flex items-center justify-end gap-2">
          <p className="text-sm muted">
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

      <DetailSidebar
        open={Boolean(activeProperty)}
        title="Property"
        subtitle={activeProperty ? propertyAddress(activeProperty) : undefined}
        onClose={() => setActivePropertyId(null)}
      >
        {activeProperty ? (
          <PropertyDetail
            key={idOf(activeProperty)}
            property={activeProperty}
            actions={fullActions(activeProperty)}
          />
        ) : null}
      </DetailSidebar>

      <DetailSidebar
        open={createOpen}
        title="New property"
        subtitle="Listed on the app under the selected broker"
        onClose={() => setCreateOpen(false)}
        widthClassName="max-w-3xl"
      >
        {createOpen ? (
          <CreatePropertyForm
            onCancel={() => setCreateOpen(false)}
            onCreated={() => {
              setCreateOpen(false);
              void loadProperties();
            }}
          />
        ) : null}
      </DetailSidebar>
      {dialog}
    </section>
  );
}

function ExpiryLabel({ expiresAt }: { expiresAt?: string }) {
  const days = daysUntil(expiresAt);
  const urgent = days !== null && days <= 2;
  return (
    <span className="inline-flex items-center gap-1" style={{ color: urgent ? "var(--warning)" : "var(--muted)" }}>
      <Clock size={12} />
      {expiryText(expiresAt)}
    </span>
  );
}

function PropertyCard({
  property,
  onOpen,
  actions,
}: {
  property: Property;
  onOpen: () => void;
  actions: React.ReactNode;
}) {
  const statusInfo = propertyStatus(property.status);
  const typeInfo = listingTypeInfo(property.listingType);
  const broker = brokerOf(property);
  const cover = coverImage(property);
  const photoCount = property.images?.length ?? 0;

  return (
    <article
      className="panel group flex cursor-pointer flex-col overflow-hidden transition hover:shadow-md"
      onClick={onOpen}
    >
      <div className="relative">
        <PropertyImage url={cover} alt={propertyTitle(property)} className="h-48 w-full" width={720} height={432} />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded-full shadow-sm" style={{ background: "var(--surface)" }}>
            <Chip tone={statusInfo.tone}>{statusInfo.label}</Chip>
          </span>
          <span className="rounded-full shadow-sm" style={{ background: "var(--surface)" }}>
            <Chip tone={typeInfo.tone} dot={false}>For {typeInfo.label.toLowerCase()}</Chip>
          </span>
        </div>
        {photoCount > 1 ? (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
            {photoCount} photos
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 truncate font-semibold">{propertyTitle(property)}</h3>
          <p className="shrink-0 font-semibold" style={{ color: "var(--primary)" }}>{formatPrice(property)}</p>
        </div>
        <p className="flex min-w-0 items-center gap-1 text-xs muted">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate">{propertyAddress(property)}</span>
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs muted">
          <span className="inline-flex min-w-0 items-center gap-1">
            <UserRound size={12} className="shrink-0" />
            <span className="max-w-[140px] truncate">{broker?.name || "Unknown broker"}</span>
          </span>
          <ExpiryLabel expiresAt={property.expiresAt} />
          <PostedByChip property={property} />
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <span className="text-[11px] muted">Listed {formatDate(property.createdAt)}</span>
          {actions}
        </div>
      </div>
    </article>
  );
}
