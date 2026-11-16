"use client";

import { brokersApi, type BrokerDetail } from "@/lib/api/modules/brokers";
import { propertiesApi } from "@/lib/api/modules/properties";
import { useToast } from "@/components/providers/toast-provider";
import { BrokerAvatar } from "@/components/brokers/broker-avatar";
import { RoleSelect, StatusSelect, useBrokerControls } from "@/components/brokers/broker-controls";
import { CreatePropertyForm } from "@/components/properties/create-property-form";
import { usePropertyActions } from "@/components/properties/property-actions";
import { PropertyImage } from "@/components/properties/property-image";
import { PostedByChip, PropertyDetail } from "@/components/properties/property-detail";
import { Chip } from "@/components/ui/chip";
import { DetailSidebar } from "@/components/ui/detail-sidebar";
import {
  PROPERTY_STATUS,
  coverImage,
  expiryText,
  formatDate,
  formatPrice,
  propertyAddress,
  propertyStatus,
  propertyTitle,
} from "@/lib/labels";
import type { Broker, Property } from "@/types/domain";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  Mail,
  Phone,
  Plus,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

const idOf = (property: Property) => property.id || property._id || "";

export default function BrokerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [detail, setDetail] = useState<BrokerDetail | null>(null);
  const [listings, setListings] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [detailResult, listResult] = await Promise.all([
        brokersApi.detail(id),
        propertiesApi.list({ brokerId: id, limit: 100 }),
      ]);
      setDetail(detailResult);
      setListings(listResult.items ?? []);
    } catch (error) {
      const code = (error as { response?: { status?: number } })?.response?.status;
      if (code === 404 || code === 400) setNotFound(true);
      else showToast({ type: "error", title: "Unable to load broker" });
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const { changeStatus, changeRole, savingId, dialog: brokerDialog } = useBrokerControls((updated) =>
    setDetail((prev) => (prev ? { ...prev, broker: { ...prev.broker, ...updated } } : prev))
  );
  const { iconActions, fullActions, dialog: propertyDialog } = usePropertyActions(load);

  if (loading) return <ProfileSkeleton />;
  if (notFound || !detail) {
    return (
      <div className="panel flex flex-col items-center gap-3 p-10 text-center">
        <p className="font-medium">Broker not found</p>
        <Link href="/brokers" className="btn-secondary">Back to brokers</Link>
      </div>
    );
  }

  const { broker, quota, listings: stats } = detail;
  const name = `${broker.fname ?? ""} ${broker.lname ?? ""}`.trim() || "Unnamed broker";
  const isBroker = (broker.role ?? "BROKER") === "BROKER";
  const filtered = statusFilter === "ALL" ? listings : listings.filter((item) => item.status === statusFilter);
  const activeProperty = listings.find((item) => idOf(item) === activePropertyId) || null;
  const statusCounts = stats.byStatus ?? {};

  const copy = (text: string, what: string) => {
    void navigator.clipboard?.writeText(text).then(
      () => showToast({ type: "success", title: `${what} copied` }),
      () => undefined
    );
  };

  const statTiles = [
    { label: "Total listings", value: stats.total },
    { label: "Live", value: statusCounts.VERIFIED ?? 0, color: "var(--success)" },
    { label: "Pending review", value: statusCounts.UNVERIFIED ?? 0, color: "var(--warning)" },
    { label: "Expired", value: statusCounts.EXPIRED ?? 0, color: "var(--danger)" },
    { label: "Closed", value: statusCounts.SOLD ?? 0, color: "var(--primary)" },
    { label: "Listing views", value: stats.totalViews },
  ];

  return (
    <section className="space-y-4">
      <Link href="/brokers" className="inline-flex items-center gap-1.5 text-sm muted hover:text-[var(--foreground)]">
        <ArrowLeft size={15} /> All brokers
      </Link>

      {/* Header */}
      <div className="panel p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <BrokerAvatar broker={broker} size={56} />
            <div className="min-w-0 space-y-1.5">
              <h2 className="truncate text-xl font-semibold">{name}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <RoleSelect broker={broker} disabled={savingId === broker._id} onChange={(next) => void changeRole(broker, next)} />
                <StatusSelect broker={broker} disabled={savingId === broker._id} onChange={(next) => void changeStatus(broker, next)} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs muted">
                {broker.phone ? (
                  <button type="button" className="inline-flex items-center gap-1 hover:text-[var(--foreground)]" onClick={() => copy(broker.phone!, "Phone")}>
                    <Phone size={12} /> {broker.phone} <Copy size={11} className="opacity-60" />
                  </button>
                ) : null}
                {broker.email ? (
                  <button type="button" className="inline-flex items-center gap-1 hover:text-[var(--foreground)]" onClick={() => copy(broker.email, "Email")}>
                    <Mail size={12} /> {broker.email} <Copy size={11} className="opacity-60" />
                  </button>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <CalendarDays size={12} /> Joined {formatDate(broker.createdAt)}
                </span>
              </div>
            </div>
          </div>
          {isBroker ? (
            <button className="btn-primary inline-flex items-center gap-1.5 self-start lg:self-center" onClick={() => setCreateOpen(true)}>
              <Plus size={16} /> New property
            </button>
          ) : null}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {statTiles.map((tile) => (
          <div key={tile.label} className="panel p-4">
            <p className="text-xs muted">{tile.label}</p>
            <p className="mt-1 text-xl font-semibold" style={tile.color ? { color: tile.color } : undefined}>{tile.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Left column */}
        <div className="space-y-4">
          <div className="panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Listing slots</h3>
              <span className="text-xs muted">{quota.planName ?? "Standard plan"}</span>
            </div>
            <div className="space-y-4">
              <SlotMeter label="Rent" used={quota.used.rent} limit={quota.limit.rent} />
              <SlotMeter label="Sale" used={quota.used.sale} limit={quota.limit.sale} />
            </div>
            <p className="mt-4 text-xs muted">
              Every listing counts, including the {stats.postedByAdmin} posted by admins. Change limits in{" "}
              <Link href="/subscriptions" style={{ color: "var(--primary)" }}>Subscriptions</Link>.
            </p>
          </div>

          <div className="panel p-5">
            <h3 className="mb-3 text-sm font-semibold">Account</h3>
            <ul className="space-y-2.5 text-sm">
              <Check ok={broker.isEmailVerified} label="Email verified" />
              <Check ok={broker.isPhoneVerified} label="Phone verified" />
              <Check ok={broker.isProfileComplete} label="Profile complete" />
              <Check ok={broker.hasPushToken} label="Push notifications on" />
            </ul>
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm" style={{ borderColor: "var(--border)" }}>
              <Fact icon={<UserCheck size={13} />} label="Sign-in">
                {broker.authProviders?.length ? broker.authProviders.map(capitalize).join(", ") : "—"}
              </Fact>
              <Fact icon={<CalendarDays size={13} />} label="Date of birth">{formatDate(broker.dob)}</Fact>
              <Fact icon={<ShieldCheck size={13} />} label="Posted by admins">{stats.postedByAdmin}</Fact>
              <Fact icon={<Bell size={13} />} label="Last updated">{formatDate(broker.updatedAt)}</Fact>
            </dl>
          </div>
        </div>

        {/* Listings */}
        <div className="panel overflow-hidden xl:col-span-2">
          <div className="space-y-3 border-b p-4" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Listings</h3>
              <span className="text-xs muted">{filtered.length} shown</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <FilterPill active={statusFilter === "ALL"} onClick={() => setStatusFilter("ALL")}>
                All · {listings.length}
              </FilterPill>
              {Object.entries(PROPERTY_STATUS).map(([value, info]) =>
                statusCounts[value] ? (
                  <FilterPill key={value} active={statusFilter === value} onClick={() => setStatusFilter(value)}>
                    {info.label} · {statusCounts[value]}
                  </FilterPill>
                ) : null
              )}
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <p className="font-medium">No listings{statusFilter !== "ALL" ? " with this status" : " yet"}</p>
              {isBroker && statusFilter === "ALL" ? (
                <button className="btn-secondary inline-flex items-center gap-1.5" onClick={() => setCreateOpen(true)}>
                  <Plus size={15} /> Post the first one
                </button>
              ) : null}
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {filtered.map((property) => {
                const info = propertyStatus(property.status);
                const cover = coverImage(property);
                return (
                  <li
                    key={idOf(property)}
                    className="flex cursor-pointer flex-col gap-3 p-4 transition hover:bg-[var(--surface-2)] sm:flex-row sm:items-center"
                    style={{ borderColor: "var(--border)" }}
                    onClick={() => setActivePropertyId(idOf(property))}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <PropertyImage
                        url={cover}
                        alt=""
                        variant="thumb"
                        rounded="rounded-lg"
                        className="h-14 w-20"
                        width={160}
                        height={112}
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate font-medium">{propertyTitle(property)}</p>
                          <Chip tone={info.tone}>{info.label}</Chip>
                          <PostedByChip property={property} />
                        </div>
                        <p className="truncate text-xs muted">{propertyAddress(property)}</p>
                        <p className="flex flex-wrap gap-x-3 text-xs muted">
                          <span className="font-medium" style={{ color: "var(--foreground)" }}>{formatPrice(property)}</span>
                          <span className="inline-flex items-center gap-1"><Clock size={11} /> {expiryText(property.expiresAt)}</span>
                          {typeof property.views === "number" ? (
                            <span className="inline-flex items-center gap-1"><Eye size={11} /> {property.views}</span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 self-end sm:self-center">{iconActions(property)}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <DetailSidebar
        open={Boolean(activeProperty)}
        title="Property"
        subtitle={activeProperty ? propertyAddress(activeProperty) : undefined}
        onClose={() => setActivePropertyId(null)}
      >
        {activeProperty ? (
          <PropertyDetail key={idOf(activeProperty)} property={activeProperty} actions={fullActions(activeProperty)} />
        ) : null}
      </DetailSidebar>

      <DetailSidebar
        open={createOpen}
        title="New property"
        subtitle={`Listed on the app under ${name}`}
        onClose={() => setCreateOpen(false)}
        widthClassName="max-w-3xl"
      >
        {createOpen ? (
          <CreatePropertyForm
            initialBroker={broker as Broker}
            onCancel={() => setCreateOpen(false)}
            onCreated={() => {
              setCreateOpen(false);
              void load();
            }}
          />
        ) : null}
      </DetailSidebar>
      {brokerDialog}
      {propertyDialog}
    </section>
  );
}

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

function SlotMeter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const percent = limit > 0 ? Math.min((used / limit) * 100, 100) : 100;
  const full = used >= limit;
  const color = full ? "var(--danger)" : percent >= 80 ? "var(--warning)" : "var(--success)";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold" style={{ color: full ? color : undefined }}>
          {used} / {limit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, background: color }} />
      </div>
      <p className="mt-1 text-xs muted">{full ? "No slots left" : `${limit - used} left`}</p>
    </div>
  );
}

function Check({ ok, label }: { ok?: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      {ok ? (
        <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
      ) : (
        <XCircle size={16} className="muted" />
      )}
      <span className={ok ? undefined : "muted"}>{label}</span>
    </li>
  );
}

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-xs muted">{icon} {label}</dt>
      <dd className="truncate font-medium">{children}</dd>
    </div>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-3 py-1 text-xs font-medium transition"
      style={{
        borderColor: active ? "var(--primary)" : "var(--border)",
        background: active ? "color-mix(in srgb, var(--primary) 12%, transparent)" : "transparent",
        color: active ? "var(--primary)" : "var(--muted)",
      }}
    >
      {children}
    </button>
  );
}

function ProfileSkeleton() {
  return (
    <section className="space-y-4">
      <div className="skeleton h-4 w-24" />
      <div className="panel flex items-center gap-4 p-5">
        <div className="skeleton h-14 w-14 !rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-5 w-48" />
          <div className="skeleton h-3 w-72" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="skeleton h-20" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="skeleton h-72" />
        <div className="skeleton h-72 xl:col-span-2" />
      </div>
    </section>
  );
}
