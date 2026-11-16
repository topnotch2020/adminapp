"use client";

import { brokersApi, type BrokerPostingQuota } from "@/lib/api/modules/brokers";
import { propertiesApi, type CreatePropertyPayload } from "@/lib/api/modules/properties";
import { uploadsApi } from "@/lib/api/modules/uploads";
import { useToast } from "@/components/providers/toast-provider";
import { AreaAutocomplete } from "@/components/ui/area-autocomplete";
import type { Broker } from "@/types/domain";
import { useEffect, useRef, useState } from "react";

const PROPERTY_TYPES = [
  { label: "Flat", value: "FLAT" },
  { label: "Row House/Bungalow", value: "ROW_HOUSE_OR_BUNGALOW" },
  { label: "Studio", value: "STUDIO" },
  { label: "Pent House/Duplex", value: "PENT_HOUSE_OR_DUPLEX" },
];
const BHK_TYPES = ["1RK", "1BHK", "2BHK", "3BHK", "4BHK", "4+BHK"];
const FURNISHING = [
  { label: "Unfurnished", value: "UN_FURNISHED" },
  { label: "Semi-Furnished", value: "SEMI_FURNISHED" },
  { label: "Fully Furnished", value: "FULLY_FURNISHED" },
];
const PROPERTY_AGES = [
  { label: "New", value: "NEW" },
  { label: "Under Construction", value: "UNDER_CONSTRUCTION", saleOnly: true },
  { label: "< 5 yrs", value: "LESS_THAN_5_YEARS" },
  { label: "5–10 yrs", value: "5_TO_10_YEARS" },
  { label: "> 10 yrs", value: "GREATER_THAN_10_YEARS" },
];
const FLOOR_LEVELS = [
  { label: "Lower", value: "LOWER" },
  { label: "Middle", value: "MIDDLE" },
  { label: "Higher", value: "HIGHER" },
];
const FACINGS = ["East", "West", "North", "South"];
const TENANTS = ["Family", "Bachelors", "Students", "Company Lease"];
const AMENITIES = [
  "Balcony", "Lift", "Parking", "Power Backup", "Gym", "Garden", "AC", "Modular Kitchen",
  "Gas Pipeline", "Security", "Pets Allowed", "Club House", "Swimming Pool", "Badminton",
  "Tennis Court", "Playground",
];
const MAX_IMAGES = 10;

type Props = {
  onCreated: () => void;
  onCancel: () => void;
};

const toNumber = (value: string) => (value.trim() && !Number.isNaN(Number(value)) ? Number(value) : undefined);

/** "2026-10-01" (date input) → "01/10/2026", the format the mobile app stores. */
const toDMY = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
};

/**
 * Admin form to post a listing on a broker's behalf. Mirrors the mobile app's
 * posting form; the listing is owned by the selected broker, so the mobile app
 * shows that broker's contact details as usual.
 */
export function CreatePropertyForm({ onCreated, onCancel }: Props) {
  const { showToast } = useToast();
  const [broker, setBroker] = useState<Broker | null>(null);
  const [quota, setQuota] = useState<BrokerPostingQuota | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const selectedBrokerId = useRef<string | null>(null);
  const [listingType, setListingType] = useState<"RENT" | "SALE">("RENT");
  const [propertyType, setPropertyType] = useState("FLAT");
  const [bhkType, setBhkType] = useState("");
  const [furnishing, setFurnishing] = useState("");
  const [propertyAge, setPropertyAge] = useState("");
  const [price, setPrice] = useState("");
  const [deposit, setDeposit] = useState("");
  const [maintenance, setMaintenance] = useState("");
  const [tenants, setTenants] = useState<string[]>([]);
  const [availableImmediately, setAvailableImmediately] = useState(true);
  const [availableFrom, setAvailableFrom] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [facing, setFacing] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [floorLevel, setFloorLevel] = useState("");
  const [carpet, setCarpet] = useState("");
  const [builtUp, setBuiltUp] = useState("");
  const [projectName, setProjectName] = useState("");
  const [areaName, setAreaName] = useState("");
  const [subArea, setSubArea] = useState("");
  const [city, setCity] = useState("Pune");
  const [pincode, setPincode] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isRent = listingType === "RENT";
  const slotKey = isRent ? "rent" : "sale";
  const slotFull = quota ? !quota.canCreateByListingType[listingType] : false;

  const selectBroker = async (next: Broker | null) => {
    selectedBrokerId.current = next?._id ?? null;
    setBroker(next);
    setQuota(null);
    if (!next) return;
    setQuotaLoading(true);
    try {
      const result = await brokersApi.postingQuota(next._id);
      // Ignore a late response if the admin already picked someone else
      if (selectedBrokerId.current === next._id) setQuota(result);
    } catch {
      // Not fatal: the server still enforces the quota when posting
    } finally {
      if (selectedBrokerId.current === next._id) setQuotaLoading(false);
    }
  };

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      showToast({ type: "error", title: `Maximum ${MAX_IMAGES} images` });
      return;
    }
    setUploading(true);
    try {
      const urls = await Promise.all(
        Array.from(files).slice(0, room).map((file) => uploadsApi.uploadPropertyImage(file))
      );
      setImages((prev) => [...prev, ...urls]);
    } catch (error) {
      showToast({
        type: "error",
        title: "Image upload failed",
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPrimaryIndex((prev) => (index === prev ? 0 : index < prev ? prev - 1 : prev));
  };

  const validate = (): string | null => {
    if (!broker) return "Select the broker this listing belongs to";
    if (slotFull) return `This broker has no ${slotKey} slots left`;
    if (!propertyType) return "Select property type";
    if (!bhkType) return "Select configuration (BHK)";
    if (!toNumber(price)) return isRent ? "Enter rent" : "Enter price";
    if (!projectName.trim()) return "Enter project / society name";
    if (!areaName.trim()) return "Enter area";
    if (!subArea.trim()) return "Enter sub-area";
    if (!city.trim()) return "Enter city";
    if (isRent && !availableImmediately && !availableFrom) return "Pick the available-from date";
    if (images.length === 0) return "Upload at least 1 image";
    return null;
  };

  const submit = async () => {
    const error = validate();
    if (error || !broker) {
      showToast({ type: "error", title: error ?? "Select a broker" });
      return;
    }

    const payload: CreatePropertyPayload = {
      listingType,
      propertyType,
      bhkType,
      propertyAge: propertyAge || undefined,
      furnishing: furnishing || undefined,
      pricing: {
        price: toNumber(price)!,
        deposit: isRent ? toNumber(deposit) : undefined,
        maintenance: isRent ? toNumber(maintenance) : undefined,
      },
      tenantsAllowed: isRent && tenants.length ? tenants : undefined,
      availableFrom: isRent ? (availableImmediately ? "Immediate" : toDMY(availableFrom)) : undefined,
      amenities: amenities.length ? amenities : undefined,
      facing: facing || undefined,
      floor: { totalFloors: toNumber(totalFloors), level: floorLevel || undefined },
      area: { carpet: toNumber(carpet), builtUp: toNumber(builtUp) },
      address: {
        projectName: projectName.trim(),
        areaName: areaName.trim(),
        subArea: subArea.trim(),
        city: city.trim(),
        pincode: pincode.trim() || undefined,
      },
      images: images.map((url, index) => ({ url, type: "INTERIOR", isPrimary: index === primaryIndex })),
    };

    setSubmitting(true);
    try {
      await propertiesApi.createForBroker(broker._id, payload);
      showToast({
        type: "success",
        title: "Property posted",
        description: `Live on the app under ${broker.fname} ${broker.lname}`.trim(),
      });
      onCreated();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast({ type: "error", title: "Could not post property", description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 text-sm">
      <Section title="Broker">
        <BrokerPicker value={broker} onChange={(next) => void selectBroker(next)} />
        {broker && quotaLoading && <p className="text-xs muted">Checking listing slots…</p>}
        {broker && quota && (
          <div
            className="rounded-lg border px-3 py-2 text-xs"
            style={{
              borderColor: slotFull ? "var(--danger)" : "var(--border)",
              background: "var(--surface-2)",
            }}
          >
            <p>
              Listing slots{quota.planName ? ` (${quota.planName})` : ""}: Rent{" "}
              <strong>{quota.used.rent}/{quota.limit.rent}</strong> · Sale{" "}
              <strong>{quota.used.sale}/{quota.limit.sale}</strong>
            </p>
            {slotFull && (
              <p className="mt-1" style={{ color: "var(--danger)" }}>
                No {slotKey} slots left. Increase this broker&apos;s {slotKey} slots in
                Subscriptions or remove one of their {slotKey} listings first.
              </p>
            )}
          </div>
        )}
        <p className="text-xs muted">
          The listing is shown on the app with this broker&apos;s name and contact. It is marked
          &quot;Posted by admin&quot; only here in the CRM.
        </p>
      </Section>

      <Section title="Listing">
        <Chips
          options={[{ label: "Rent", value: "RENT" }, { label: "Sale", value: "SALE" }]}
          selected={[listingType]}
          onToggle={(value) => {
            setListingType(value as "RENT" | "SALE");
            if (value === "RENT" && propertyAge === "UNDER_CONSTRUCTION") setPropertyAge("");
          }}
        />
        <Field label="Property type">
          <Chips options={PROPERTY_TYPES} selected={[propertyType]} onToggle={setPropertyType} />
        </Field>
        <Field label="Configuration">
          <Chips
            options={BHK_TYPES.map((value) => ({ label: value, value }))}
            selected={[bhkType]}
            onToggle={setBhkType}
          />
        </Field>
        <Field label="Furnishing">
          <Chips
            options={FURNISHING}
            selected={[furnishing]}
            onToggle={(value) => setFurnishing(value === furnishing ? "" : value)}
          />
        </Field>
        <Field label="Property age">
          <Chips
            options={PROPERTY_AGES.filter((age) => !age.saleOnly || !isRent)}
            selected={[propertyAge]}
            onToggle={(value) => setPropertyAge(value === propertyAge ? "" : value)}
          />
        </Field>
      </Section>

      <Section title="Pricing">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label={isRent ? "Rent (₹/month) *" : "Price (₹) *"}>
            <input className="input" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>
          {isRent ? (
            <>
              <Field label="Deposit (₹)">
                <input className="input" inputMode="numeric" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
              </Field>
              <Field label="Maintenance (₹/month)">
                <input className="input" inputMode="numeric" value={maintenance} onChange={(e) => setMaintenance(e.target.value)} />
              </Field>
            </>
          ) : null}
        </div>
      </Section>

      {isRent ? (
        <Section title="Tenants & availability">
          <Field label="Tenants allowed">
            <Chips
              options={TENANTS.map((value) => ({ label: value, value }))}
              selected={tenants}
              onToggle={(value) => setTenants((prev) => toggle(prev, value))}
            />
          </Field>
          <Field label="Available from">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={availableImmediately}
                  onChange={(e) => setAvailableImmediately(e.target.checked)}
                />
                Immediately
              </label>
              {!availableImmediately ? (
                <input
                  type="date"
                  className="input max-w-xs"
                  value={availableFrom}
                  onChange={(e) => setAvailableFrom(e.target.value)}
                />
              ) : null}
            </div>
          </Field>
        </Section>
      ) : null}

      <Section title="Details">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Total floors">
            <input className="input" inputMode="numeric" value={totalFloors} onChange={(e) => setTotalFloors(e.target.value)} />
          </Field>
          <Field label="Floor level">
            <select className="input" value={floorLevel} onChange={(e) => setFloorLevel(e.target.value)}>
              <option value="">—</option>
              {FLOOR_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Carpet area (sq ft)">
            <input className="input" inputMode="numeric" value={carpet} onChange={(e) => setCarpet(e.target.value)} />
          </Field>
          <Field label="Built-up area (sq ft)">
            <input className="input" inputMode="numeric" value={builtUp} onChange={(e) => setBuiltUp(e.target.value)} />
          </Field>
        </div>
        <Field label="Facing">
          <Chips
            options={FACINGS.map((value) => ({ label: value, value }))}
            selected={[facing]}
            onToggle={(value) => setFacing(value === facing ? "" : value)}
          />
        </Field>
        <Field label="Amenities">
          <Chips
            options={AMENITIES.map((value) => ({ label: value, value }))}
            selected={amenities}
            onToggle={(value) => setAmenities((prev) => toggle(prev, value))}
          />
        </Field>
      </Section>

      <Section title="Address">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Project / Society name *">
            <input className="input" placeholder="e.g. Shilp Aaron" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
          </Field>
          <Field label="Area *">
            <AreaAutocomplete value={areaName} onChange={setAreaName} placeholder="e.g. Baner" />
          </Field>
          <Field label="Sub-area *">
            <input className="input" placeholder="e.g. Pancard Club Road" value={subArea} onChange={(e) => setSubArea(e.target.value)} />
          </Field>
          <Field label="City *">
            <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label="Pincode">
            <input className="input" inputMode="numeric" value={pincode} onChange={(e) => setPincode(e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title={`Photos (${images.length}/${MAX_IMAGES}) *`}>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading || images.length >= MAX_IMAGES}
          onChange={(e) => {
            void uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {uploading ? <p className="text-xs muted">Uploading…</p> : null}
        {images.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {images.map((url, index) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`photo-${index + 1}`} className="h-24 w-full rounded-lg object-cover" />
                <div className="mt-1 flex items-center justify-between text-xs">
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="primary-image"
                      checked={index === primaryIndex}
                      onChange={() => setPrimaryIndex(index)}
                    />
                    Cover
                  </label>
                  <button type="button" style={{ color: "var(--danger)" }} onClick={() => removeImage(index)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Section>

      <div className="flex justify-end gap-2 border-t pt-4" style={{ borderColor: "var(--border)" }}>
        <button className="btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button className="btn-primary" onClick={() => void submit()} disabled={submitting || uploading || slotFull}>
          {submitting ? "Posting…" : "Post property"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="font-semibold">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs muted">{label}</p>
      {children}
    </div>
  );
}

function Chips({
  options,
  selected,
  onToggle,
}: {
  options: { label: string; value: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onToggle(option.value)}
            className="rounded-full border px-3 py-1 text-xs"
            style={{
              borderColor: active ? "var(--primary)" : "var(--border)",
              background: active ? "var(--primary)" : "var(--surface-2)",
              color: active ? "var(--primary-foreground)" : undefined,
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Search brokers by name, email or phone and pick one. */
function BrokerPicker({
  value,
  onChange,
}: {
  value: Broker | null;
  onChange: (broker: Broker | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (value || !query.trim()) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { items } = await brokersApi.list({ search: query.trim(), role: "BROKER", limit: 8 });
        setResults(items);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, value]);

  // Results from an earlier query are hidden once the box is cleared
  const visibleResults = query.trim() ? results : [];

  if (value) {
    return (
      <div className="panel flex items-center justify-between p-3">
        <div>
          <p className="font-medium">{`${value.fname} ${value.lname}`.trim()}</p>
          <p className="text-xs muted">{[value.phone, value.email].filter(Boolean).join(" · ")}</p>
        </div>
        <button className="btn-secondary !py-1" onClick={() => onChange(null)}>
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        className="input"
        placeholder="Search broker by name, email or phone"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading ? <p className="text-xs muted">Searching…</p> : null}
      {visibleResults.length > 0 ? (
        <div className="panel divide-y" style={{ borderColor: "var(--border)" }}>
          {visibleResults.map((broker) => (
            <button
              key={broker._id}
              type="button"
              className="block w-full p-3 text-left hover:opacity-80"
              onClick={() => {
                onChange(broker);
                setQuery("");
              }}
            >
              <p className="font-medium">{`${broker.fname} ${broker.lname}`.trim()}</p>
              <p className="text-xs muted">
                {[broker.phone, broker.email, broker.status].filter(Boolean).join(" · ")}
              </p>
            </button>
          ))}
        </div>
      ) : query.trim() && !loading ? (
        <p className="text-xs muted">No brokers match</p>
      ) : null}
    </div>
  );
}
