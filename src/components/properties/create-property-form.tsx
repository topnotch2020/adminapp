"use client";

import { brokersApi, type BrokerPostingQuota } from "@/lib/api/modules/brokers";
import { propertiesApi, type CreatePropertyPayload } from "@/lib/api/modules/properties";
import { uploadsApi } from "@/lib/api/modules/uploads";
import { useToast } from "@/components/providers/toast-provider";
import { AreaAutocomplete } from "@/components/ui/area-autocomplete";
import { Chip } from "@/components/ui/chip";
import { brokerStatus } from "@/lib/labels";
import type { Broker } from "@/types/domain";
import {
  Check,
  ImagePlus,
  Loader2,
  Search,
  Star,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

const PROPERTY_TYPES = [
  { label: "Flat", value: "FLAT" },
  { label: "Row House / Bungalow", value: "ROW_HOUSE_OR_BUNGALOW" },
  { label: "Studio", value: "STUDIO" },
  { label: "Pent House / Duplex", value: "PENT_HOUSE_OR_DUPLEX" },
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
const INPUT = "input w-full min-w-0";

type Props = {
  onCreated: () => void;
  onCancel: () => void;
  /** Preselects the broker, e.g. when opened from a broker's page. */
  initialBroker?: Broker | null;
};

const toNumber = (value: string) => (value.trim() && !Number.isNaN(Number(value)) ? Number(value) : undefined);

/** Keeps only digits, for amount / area / count fields. */
const digitsOnly = (value: string) => value.replace(/[^\d]/g, "");

/** "2026-10-01" (date input) → "01/10/2026", the format the mobile app stores. */
const toDMY = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
};

const brokerName = (broker: Broker) => `${broker.fname ?? ""} ${broker.lname ?? ""}`.trim() || "Unnamed broker";

const initials = (broker: Broker) =>
  `${broker.fname?.[0] ?? ""}${broker.lname?.[0] ?? ""}`.toUpperCase() || "B";

/**
 * Admin form to post a listing on a broker's behalf. Mirrors the mobile app's
 * posting form; the listing is owned by the selected broker, so the mobile app
 * shows that broker's contact details as usual.
 */
export function CreatePropertyForm({ onCreated, onCancel, initialBroker = null }: Props) {
  const { showToast } = useToast();
  const [broker, setBroker] = useState<Broker | null>(initialBroker);
  // Quota is tagged with the broker it belongs to, so a late response for a
  // previously picked broker is never shown for the current one
  const [quotaState, setQuotaState] = useState<{ brokerId: string; quota: BrokerPostingQuota | null } | null>(null);
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
  const [pendingUploads, setPendingUploads] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!broker) return;
    const brokerId = broker._id;
    let cancelled = false;
    brokersApi
      .postingQuota(brokerId)
      .then((quota) => !cancelled && setQuotaState({ brokerId, quota }))
      // Not fatal: the server still enforces the quota when posting
      .catch(() => !cancelled && setQuotaState({ brokerId, quota: null }));
    return () => {
      cancelled = true;
    };
  }, [broker]);

  const quota = broker && quotaState?.brokerId === broker._id ? quotaState.quota : null;
  const quotaLoading = Boolean(broker) && quotaState?.brokerId !== broker?._id;
  const isRent = listingType === "RENT";
  const uploading = pendingUploads > 0;
  const slotKey = isRent ? "rent" : "sale";
  const slotFull = quota ? !quota.canCreateByListingType[listingType] : false;

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const uploadFiles = async (files: FileList | File[] | null) => {
    const picked = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    if (!picked.length) return;
    const room = MAX_IMAGES - images.length - pendingUploads;
    if (room <= 0) {
      showToast({ type: "error", title: `Maximum ${MAX_IMAGES} photos` });
      return;
    }
    const batch = picked.slice(0, room);
    if (picked.length > room) {
      showToast({ type: "info", title: `Only ${room} more photo${room === 1 ? "" : "s"} can be added` });
    }

    setPendingUploads((count) => count + batch.length);
    const results = await Promise.allSettled(
      batch.map(async (file) => {
        try {
          const url = await uploadsApi.uploadPropertyImage(file);
          setImages((prev) => [...prev, url]);
        } finally {
          setPendingUploads((count) => count - 1);
        }
      })
    );
    const failed = results.filter((result) => result.status === "rejected").length;
    if (failed) {
      showToast({ type: "error", title: `${failed} photo${failed === 1 ? "" : "s"} failed to upload` });
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
    if (images.length === 0) return "Upload at least 1 photo";
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
        description: `Live on the app under ${brokerName(broker)}`,
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
    <div className="space-y-4 text-sm">
      <Card step={1} title="Broker" hint="The app shows this broker's name and contact on the listing.">
        <BrokerPicker value={broker} onChange={setBroker} />
        {broker ? (
          <QuotaSummary quota={quota} loading={quotaLoading} listingType={listingType} />
        ) : null}
      </Card>

      <Card step={2} title="Listing">
        <Field label="Listing for" required>
          <Segmented
            options={[{ label: "Rent", value: "RENT" }, { label: "Sale", value: "SALE" }]}
            value={listingType}
            onChange={(value) => {
              setListingType(value as "RENT" | "SALE");
              if (value === "RENT" && propertyAge === "UNDER_CONSTRUCTION") setPropertyAge("");
            }}
          />
        </Field>
        {slotFull ? (
          <p className="text-xs" style={{ color: "var(--danger)" }}>
            No {slotKey} slots left for this broker. Increase their {slotKey} slots in Subscriptions
            or remove one of their {slotKey} listings first.
          </p>
        ) : null}
        <Field label="Property type" required>
          <Chips options={PROPERTY_TYPES} selected={[propertyType]} onToggle={setPropertyType} />
        </Field>
        <Field label="Configuration" required>
          <Chips
            options={BHK_TYPES.map((value) => ({ label: value, value }))}
            selected={[bhkType]}
            onToggle={setBhkType}
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
        </div>
      </Card>

      <Card step={3} title="Pricing">
        <div className={`grid grid-cols-1 gap-4 ${isRent ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          <Field label={isRent ? "Monthly rent" : "Price"} required>
            <AffixInput prefix="₹" value={price} onChange={(v) => setPrice(digitsOnly(v))} placeholder="0" />
          </Field>
          {isRent ? (
            <>
              <Field label="Deposit">
                <AffixInput prefix="₹" value={deposit} onChange={(v) => setDeposit(digitsOnly(v))} placeholder="0" />
              </Field>
              <Field label="Maintenance">
                <AffixInput
                  prefix="₹"
                  suffix="/mo"
                  value={maintenance}
                  onChange={(v) => setMaintenance(digitsOnly(v))}
                  placeholder="0"
                />
              </Field>
            </>
          ) : null}
        </div>
        {isRent ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Field label="Tenants allowed">
              <Chips
                options={TENANTS.map((value) => ({ label: value, value }))}
                selected={tenants}
                onToggle={(value) => setTenants((prev) => toggle(prev, value))}
              />
            </Field>
            <Field label="Available from" required>
              <div className="space-y-2">
                <Segmented
                  options={[{ label: "Immediately", value: "NOW" }, { label: "Pick a date", value: "DATE" }]}
                  value={availableImmediately ? "NOW" : "DATE"}
                  onChange={(value) => setAvailableImmediately(value === "NOW")}
                />
                {!availableImmediately ? (
                  <input
                    type="date"
                    className={INPUT}
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                  />
                ) : null}
              </div>
            </Field>
          </div>
        ) : null}
      </Card>

      <Card step={4} title="Property details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Carpet area">
            <AffixInput suffix="sq ft" value={carpet} onChange={(v) => setCarpet(digitsOnly(v))} placeholder="0" />
          </Field>
          <Field label="Built-up area">
            <AffixInput suffix="sq ft" value={builtUp} onChange={(v) => setBuiltUp(digitsOnly(v))} placeholder="0" />
          </Field>
          <Field label="Total floors in building">
            <AffixInput value={totalFloors} onChange={(v) => setTotalFloors(digitsOnly(v))} placeholder="e.g. 12" />
          </Field>
          <Field label="Floor level">
            <select className={INPUT} value={floorLevel} onChange={(e) => setFloorLevel(e.target.value)}>
              <option value="">Select</option>
              {FLOOR_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Facing">
          <Chips
            options={FACINGS.map((value) => ({ label: value, value }))}
            selected={[facing]}
            onToggle={(value) => setFacing(value === facing ? "" : value)}
          />
        </Field>
        <Field label={`Amenities${amenities.length ? ` (${amenities.length})` : ""}`}>
          <Chips
            options={AMENITIES.map((value) => ({ label: value, value }))}
            selected={amenities}
            onToggle={(value) => setAmenities((prev) => toggle(prev, value))}
          />
        </Field>
      </Card>

      <Card step={5} title="Address">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Project / society name" required className="sm:col-span-2">
            <input className={INPUT} placeholder="e.g. Shilp Aaron" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
          </Field>
          <Field label="Area" required>
            <AreaAutocomplete value={areaName} onChange={setAreaName} placeholder="e.g. Baner" className={INPUT} />
          </Field>
          <Field label="Sub-area" required>
            <input className={INPUT} placeholder="e.g. Pancard Club Road" value={subArea} onChange={(e) => setSubArea(e.target.value)} />
          </Field>
          <Field label="City" required>
            <input className={INPUT} value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label="Pincode">
            <input
              className={INPUT}
              inputMode="numeric"
              maxLength={6}
              placeholder="e.g. 411045"
              value={pincode}
              onChange={(e) => setPincode(digitsOnly(e.target.value))}
            />
          </Field>
        </div>
      </Card>

      <Card
        step={6}
        title="Photos"
        hint={`${images.length}/${MAX_IMAGES} added · the cover photo is shown first on the app`}
      >
        <PhotoUploader
          images={images}
          pending={pendingUploads}
          primaryIndex={primaryIndex}
          onFiles={(files) => void uploadFiles(files)}
          onRemove={removeImage}
          onMakeCover={setPrimaryIndex}
        />
      </Card>

      <div
        className="sticky bottom-0 -mx-5 -mb-5 flex items-center justify-between gap-3 border-t px-5 py-3"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <p className="hidden text-xs muted sm:block">
          Goes live immediately · marked &quot;Posted by admin&quot; only in the CRM
        </p>
        <div className="ml-auto flex gap-2">
          <button className="btn-secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button
            className="btn-primary inline-flex items-center gap-2"
            onClick={() => void submit()}
            disabled={submitting || uploading || slotFull}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitting ? "Posting…" : uploading ? "Uploading photos…" : "Post property"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Card({
  step,
  title,
  hint,
  children,
}: {
  step: number;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="panel space-y-4 p-4 sm:p-5">
      <header className="flex items-start gap-3">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
          style={{ background: "var(--sidebar-active)", color: "var(--primary)" }}
        >
          {step}
        </span>
        <div className="min-w-0">
          <h4 className="font-semibold leading-6">{title}</h4>
          {hint ? <p className="text-xs muted">{hint}</p> : null}
        </div>
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`min-w-0 space-y-1.5 ${className}`}>
      <p className="text-xs font-medium muted">
        {label}
        {required ? <span style={{ color: "var(--danger)" }}> *</span> : null}
      </p>
      {children}
    </div>
  );
}

/** Text input with an optional fixed prefix (₹) or suffix (sq ft) inside the box. */
function AffixInput({
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <div
      className="flex w-full min-w-0 items-center rounded-xl border transition focus-within:shadow-[0_0_0_3px_var(--ring)]"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      {prefix ? <span className="pl-3 text-sm muted">{prefix}</span> : null}
      <input
        className="w-full min-w-0 bg-transparent px-3 py-2 text-sm outline-none"
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {suffix ? <span className="whitespace-nowrap pr-3 text-xs muted">{suffix}</span> : null}
    </div>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className="inline-flex rounded-xl border p-1"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className="rounded-lg px-4 py-1.5 text-sm font-medium transition"
            style={{
              background: active ? "var(--surface)" : "transparent",
              color: active ? "var(--primary)" : "var(--muted)",
              boxShadow: active ? "0 1px 2px rgba(15, 23, 42, 0.08)" : undefined,
            }}
          >
            {option.label}
          </button>
        );
      })}
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
            className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition"
            style={{
              borderColor: active ? "var(--primary)" : "var(--border)",
              background: active ? "color-mix(in srgb, var(--primary) 12%, transparent)" : "var(--surface)",
              color: active ? "var(--primary)" : undefined,
            }}
          >
            {active ? <Check size={12} /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function QuotaSummary({
  quota,
  loading,
  listingType,
}: {
  quota: BrokerPostingQuota | null;
  loading: boolean;
  listingType: "RENT" | "SALE";
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="skeleton h-14" />
        <div className="skeleton h-14" />
      </div>
    );
  }
  if (!quota) return null;

  const rows = [
    { key: "RENT" as const, label: "Rent slots", used: quota.used.rent, limit: quota.limit.rent },
    { key: "SALE" as const, label: "Sale slots", used: quota.used.sale, limit: quota.limit.sale },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {rows.map((row) => {
        const full = !quota.canCreateByListingType[row.key];
        const percent = row.limit > 0 ? Math.min((row.used / row.limit) * 100, 100) : 100;
        const color = full ? "var(--danger)" : percent >= 80 ? "var(--warning)" : "var(--success)";
        return (
          <div
            key={row.key}
            className="rounded-xl border p-3"
            style={{
              borderColor: row.key === listingType ? color : "var(--border)",
              background: "var(--surface-2)",
            }}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="muted">{row.label}</span>
              <span className="font-semibold" style={{ color: full ? color : undefined }}>
                {row.used}/{row.limit}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
              <div className="h-full rounded-full" style={{ width: `${percent}%`, background: color }} />
            </div>
          </div>
        );
      })}
      {quota.planName ? <p className="col-span-2 text-xs muted">Plan: {quota.planName}</p> : null}
    </div>
  );
}

function PhotoUploader({
  images,
  pending,
  primaryIndex,
  onFiles,
  onRemove,
  onMakeCover,
}: {
  images: string[];
  pending: number;
  primaryIndex: number;
  onFiles: (files: FileList) => void;
  onRemove: (index: number) => void;
  onMakeCover: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const full = images.length + pending >= MAX_IMAGES;

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {!full ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
          }}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition"
          style={{
            borderColor: dragging ? "var(--primary)" : "var(--border)",
            background: dragging
              ? "color-mix(in srgb, var(--primary) 8%, transparent)"
              : "var(--surface-2)",
          }}
        >
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{ background: "var(--sidebar-active)", color: "var(--primary)" }}
          >
            <ImagePlus size={20} />
          </span>
          <span className="font-medium">
            <span style={{ color: "var(--primary)" }}>Click to upload</span> or drag and drop
          </span>
          <span className="text-xs muted">
            JPG, PNG or WEBP · up to {MAX_IMAGES - images.length - pending} more
          </span>
        </button>
      ) : null}

      {images.length > 0 || pending > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((url, index) => {
            const isCover = index === primaryIndex;
            return (
              <div
                key={url}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl border"
                style={{ borderColor: isCover ? "var(--primary)" : "var(--border)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
                {isCover ? (
                  <span
                    className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                  >
                    <Star size={11} /> Cover
                  </span>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 flex justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                  {!isCover ? (
                    <button
                      type="button"
                      onClick={() => onMakeCover(index)}
                      className="rounded-lg bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-900"
                    >
                      Set as cover
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => onRemove(index)}
                    className="rounded-lg bg-white/90 p-1.5 text-red-600"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
          {Array.from({ length: pending }).map((_, index) => (
            <div
              key={`pending-${index}`}
              className="skeleton flex aspect-[4/3] items-center justify-center rounded-xl"
            >
              <Loader2 size={18} className="animate-spin muted" />
            </div>
          ))}
        </div>
      ) : null}
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
  const [searchedFor, setSearchedFor] = useState("");

  useEffect(() => {
    if (value || !query.trim()) return;
    const term = query.trim();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { items } = await brokersApi.list({ search: term, role: "BROKER", limit: 8 });
        setResults(items);
      } catch {
        setResults([]);
      } finally {
        setSearchedFor(term);
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, value]);

  if (value) {
    return (
      <div
        className="flex items-center gap-3 rounded-xl border p-3"
        style={{ borderColor: "var(--primary)", background: "var(--sidebar-active)" }}
      >
        <Avatar broker={value} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{brokerName(value)}</p>
          <p className="truncate text-xs muted">
            {[value.phone, value.email].filter(Boolean).join(" · ")}
          </p>
        </div>
        <button className="btn-secondary !px-3 !py-1.5 text-xs" onClick={() => onChange(null)}>
          Change
        </button>
      </div>
    );
  }

  const term = query.trim();
  const settled = !loading && searchedFor === term;
  const showPanel = term.length > 0;

  return (
    <div className="relative">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 muted" />
        <input
          className={`${INPUT} pl-9 pr-9`}
          placeholder="Search broker by name, email or phone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 muted"
            onClick={() => setQuery("")}
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {showPanel ? (
        <div
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-xl border p-1 shadow-lg"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          {!settled ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 p-2">
                <div className="skeleton h-9 w-9 !rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-1/3" />
                  <div className="skeleton h-2.5 w-1/2" />
                </div>
              </div>
            ))
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-3 py-6 text-center">
              <UserRound size={18} className="muted" />
              <p className="text-sm">No brokers match &quot;{term}&quot;</p>
              <p className="text-xs muted">Try a name, phone number or email</p>
            </div>
          ) : (
            results.map((broker) => (
              <button
                key={broker._id}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-[var(--surface-2)]"
                onClick={() => {
                  onChange(broker);
                  setQuery("");
                }}
              >
                <Avatar broker={broker} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{brokerName(broker)}</p>
                  <p className="truncate text-xs muted">
                    {[broker.phone, broker.email].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {broker.status ? <StatusBadge status={broker.status} /> : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function Avatar({ broker }: { broker: Broker }) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
      style={{ background: "color-mix(in srgb, var(--primary) 15%, transparent)", color: "var(--primary)" }}
    >
      {initials(broker)}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const info = brokerStatus(status);
  return <Chip tone={info.tone}>{info.label}</Chip>;
}
