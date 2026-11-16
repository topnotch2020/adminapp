import type { Property } from "@/types/domain";

/** Visual tone of a status chip; maps to the theme colours. */
export type Tone = "success" | "warning" | "danger" | "primary" | "neutral" | "info";

type LabelInfo = { label: string; tone: Tone };

const humanize = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const lookup = (map: Record<string, LabelInfo>, value?: string, fallbackTone: Tone = "neutral"): LabelInfo =>
  value && map[value] ? map[value] : { label: value ? humanize(value) : "Unknown", tone: fallbackTone };

export const PROPERTY_STATUS: Record<string, LabelInfo> = {
  DRAFTED: { label: "Draft", tone: "neutral" },
  UNVERIFIED: { label: "Pending review", tone: "warning" },
  VERIFIED: { label: "Live", tone: "success" },
  EXPIRED: { label: "Expired", tone: "danger" },
  SOLD: { label: "Sold", tone: "primary" },
};

export const LISTING_TYPE: Record<string, LabelInfo> = {
  RENT: { label: "Rent", tone: "info" },
  SALE: { label: "Sale", tone: "primary" },
};

export const BROKER_STATUS: Record<string, LabelInfo> = {
  PENDING_VERIFICATION: { label: "Pending", tone: "warning" },
  VERIFIED: { label: "Verified", tone: "success" },
  SUSPENDED: { label: "Suspended", tone: "danger" },
  BLOCKED: { label: "Blocked", tone: "danger" },
};

export const BROKER_ROLE: Record<string, LabelInfo> = {
  BROKER: { label: "Broker", tone: "neutral" },
  ADMIN: { label: "Admin", tone: "primary" },
};

export const PROPERTY_TYPE_LABEL: Record<string, string> = {
  FLAT: "Flat",
  ROW_HOUSE_OR_BUNGALOW: "Row House / Bungalow",
  STUDIO: "Studio",
  PENT_HOUSE_OR_DUPLEX: "Penthouse / Duplex",
};

export const FURNISHING_LABEL: Record<string, string> = {
  UN_FURNISHED: "Unfurnished",
  SEMI_FURNISHED: "Semi-furnished",
  FULLY_FURNISHED: "Fully furnished",
};

export const propertyStatus = (value?: string) => lookup(PROPERTY_STATUS, value);
export const listingType = (value?: string) => lookup(LISTING_TYPE, value);
export const brokerStatus = (value?: string) => lookup(BROKER_STATUS, value ?? "PENDING_VERIFICATION");
export const brokerRole = (value?: string) => lookup(BROKER_ROLE, value ?? "BROKER");

export const label = (map: Record<string, string>, value?: string) =>
  value ? map[value] ?? humanize(value) : "";

/** "2BHK Flat", from the BHK and property type, whichever shape the API sent. */
export function propertyTitle(property: Property) {
  const rawType = typeof property.propertyType === "string" ? property.propertyType : property.propertyType?.value;
  const typeLabel =
    (typeof property.propertyType === "object" ? property.propertyType?.label : undefined) ||
    label(PROPERTY_TYPE_LABEL, rawType);
  return [property.bhkType, typeLabel].filter(Boolean).join(" ") || "Property";
}

export function propertyAddress(property: Property, full = false) {
  const a = property.address;
  const parts = full
    ? [a?.projectName, a?.subArea, a?.areaName, a?.city, a?.pincode]
    : [a?.projectName, a?.areaName, a?.city];
  return parts.filter(Boolean).join(", ") || "No address";
}

/** ₹45,000 / ₹1.25 Cr / ₹85 L — compact Indian formatting, "/mo" for rentals. */
export function formatPrice(property: Property) {
  const price = property.pricing?.price;
  if (!price) return property.pricing?.formattedPrice ? `₹${property.pricing.formattedPrice}` : "—";
  let text: string;
  if (price >= 1_00_00_000) text = `₹${trim(price / 1_00_00_000)} Cr`;
  else if (price >= 1_00_000) text = `₹${trim(price / 1_00_000)} L`;
  else text = `₹${price.toLocaleString("en-IN")}`;
  return property.listingType === "RENT" ? `${text}/mo` : text;
}

const trim = (value: number) => Number(value.toFixed(2)).toString();

export function coverImage(property: Property) {
  const images = property.images ?? [];
  return (images.find((image) => image?.isPrimary) ?? images[0])?.url;
}

export function brokerOf(property: Property) {
  if (typeof property.brokerId === "object" && property.brokerId) {
    return {
      id: property.brokerId._id,
      name: `${property.brokerId.fname ?? ""} ${property.brokerId.lname ?? ""}`.trim(),
      email: property.brokerId.email,
      phone: property.brokerId.phone,
    };
  }
  if (property.broker) return { id: undefined, ...property.broker };
  return null;
}

export function daysUntil(date?: string): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

/** "12d left", "Expires today", "Expired 3d ago". */
export function expiryText(expiresAt?: string) {
  const days = daysUntil(expiresAt);
  if (days === null) return "No expiry";
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Expires today";
  return `${days}d left`;
}

export function formatDate(value?: string, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
