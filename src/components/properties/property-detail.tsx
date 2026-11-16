"use client";

import { Chip } from "@/components/ui/chip";
import {
  FURNISHING_LABEL,
  brokerOf,
  daysUntil,
  expiryText,
  formatDate,
  formatPrice,
  label,
  listingType,
  propertyAddress,
  propertyStatus,
  propertyTitle,
} from "@/lib/labels";
import type { Property } from "@/types/domain";
import { Clock, ExternalLink, Eye, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { PropertyImage } from "./property-image";
import Link from "next/link";
import { useState, type ReactNode } from "react";

const AGE_LABEL: Record<string, string> = {
  NEW: "New",
  UNDER_CONSTRUCTION: "Under construction",
  LESS_THAN_5_YEARS: "Less than 5 years",
  "5_TO_10_YEARS": "5–10 years",
  GREATER_THAN_10_YEARS: "More than 10 years",
};

const rupees = (value?: number) => (value ? `₹${value.toLocaleString("en-IN")}` : undefined);

/** "Posted by admin · Priya" chip; older listings without postedBy were posted by brokers. */
export function PostedByChip({ property }: { property: Property }) {
  if (property.postedBy?.role !== "ADMIN") return null;
  return (
    <Chip
      tone="primary"
      icon={<ShieldCheck size={12} />}
      title="Posted from the admin CRM on the broker's behalf"
    >
      Admin{property.postedBy.adminName ? ` · ${property.postedBy.adminName}` : ""}
    </Chip>
  );
}

/** Full listing view for the side panel. `actions` renders the admin buttons. */
export function PropertyDetail({ property, actions }: { property: Property; actions: ReactNode }) {
  const images = (property.images ?? []).map((image) => image?.url).filter((url): url is string => Boolean(url));
  const initialIndex = Math.max(0, (property.images ?? []).findIndex((image) => image?.isPrimary));
  const [active, setActive] = useState(initialIndex);
  const status = propertyStatus(property.status);
  const type = listingType(property.listingType);
  const broker = brokerOf(property);
  const isRent = property.listingType === "RENT";
  const days = daysUntil(property.expiresAt);

  const facts: [string, ReactNode][] = [
    [isRent ? "Monthly rent" : "Price", formatPrice(property)],
    ...(isRent
      ? ([
          ["Deposit", rupees(property.pricing?.deposit)],
          ["Maintenance", property.pricing?.maintenance ? `${rupees(property.pricing.maintenance)}/mo` : undefined],
          ["Available from", property.availableFrom],
          ["Tenants", property.tenantsAllowed?.join(", ")],
        ] as [string, ReactNode][])
      : []),
    ["Furnishing", label(FURNISHING_LABEL, property.furnishing)],
    ["Property age", label(AGE_LABEL, property.propertyAge)],
    ["Carpet area", property.area?.carpet ? `${property.area.carpet} sq ft` : undefined],
    ["Built-up area", property.area?.builtUp ? `${property.area.builtUp} sq ft` : undefined],
    [
      "Floor",
      [
        property.floor?.level && label({}, property.floor.level),
        property.floor?.totalFloors && `${property.floor.totalFloors} floors`,
      ]
        .filter(Boolean)
        .join(" · "),
    ],
    ["Facing", property.facing],
    ["Listed on", formatDate(property.createdAt)],
    ["Last updated", formatDate(property.updatedAt, true)],
  ];

  return (
    <div className="space-y-5 text-sm">
      {/* Gallery */}
      <div className="space-y-2">
        <PropertyImage
          url={images[Math.min(active, images.length - 1)]}
          alt={propertyTitle(property)}
          rounded="rounded-2xl"
          className="h-64 w-full sm:h-72"
          width={1200}
          height={720}
        />
        {images.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((url, index) => (
              <button
                key={url}
                type="button"
                onClick={() => setActive(index)}
                className="shrink-0 rounded-lg border-2 transition"
                style={{ borderColor: index === active ? "var(--primary)" : "transparent" }}
              >
                <PropertyImage
                  url={url}
                  alt={`Photo ${index + 1}`}
                  variant="thumb"
                  rounded="rounded-md"
                  className="h-14 w-20"
                  width={160}
                  height={112}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Title */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip tone={status.tone}>{status.label}</Chip>
          <Chip tone={type.tone} dot={false}>For {type.label.toLowerCase()}</Chip>
          <PostedByChip property={property} />
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold">{propertyTitle(property)}</h2>
          <p className="text-xl font-semibold" style={{ color: "var(--primary)" }}>{formatPrice(property)}</p>
        </div>
        <p className="flex items-start gap-1.5 muted">
          <MapPin size={14} className="mt-0.5 shrink-0" />
          {propertyAddress(property, true)}
        </p>
        <div className="flex flex-wrap gap-4 text-xs muted">
          <span className="inline-flex items-center gap-1" style={days !== null && days <= 2 ? { color: "var(--warning)" } : undefined}>
            <Clock size={13} /> {expiryText(property.expiresAt)}
            {property.expiresAt ? ` · ${formatDate(property.expiresAt)}` : ""}
          </span>
          {typeof property.views === "number" ? (
            <span className="inline-flex items-center gap-1">
              <Eye size={13} /> {property.views} views
            </span>
          ) : null}
        </div>
      </div>

      {/* Admin actions */}
      <section className="panel p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide muted">Actions</p>
        {actions}
      </section>

      {/* Facts */}
      <section className="panel p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide muted">Details</p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          {facts.map(([name, value]) => (
            <div key={name} className="min-w-0">
              <dt className="text-xs muted">{name}</dt>
              <dd className="truncate font-medium">{value || "—"}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4">
          <p className="text-xs muted">Amenities</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {property.amenities?.length ? (
              property.amenities.map((amenity) => (
                <span key={amenity} className="rounded-full px-2.5 py-0.5 text-xs" style={{ background: "var(--surface-2)" }}>
                  {amenity}
                </span>
              ))
            ) : (
              <span className="text-xs muted">None listed</span>
            )}
          </div>
        </div>
      </section>

      {/* Broker */}
      {broker ? (
        <section className="panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide muted">Broker</p>
            {broker.id ? (
              <Link
                href={`/brokers/${broker.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium"
                style={{ color: "var(--primary)" }}
              >
                Open profile <ExternalLink size={12} />
              </Link>
            ) : null}
          </div>
          <p className="font-medium">{broker.name || "Unnamed broker"}</p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs muted">
            {broker.phone ? (
              <span className="inline-flex items-center gap-1"><Phone size={12} /> {broker.phone}</span>
            ) : null}
            {broker.email ? (
              <span className="inline-flex items-center gap-1"><Mail size={12} /> {broker.email}</span>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
