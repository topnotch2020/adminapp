"use client";

import { brokersApi } from "@/lib/api/modules/brokers";
import { marketingApi } from "@/lib/api/modules/marketing";
import { systemApi } from "@/lib/api/modules/system";
import { FormEvent, useEffect, useState } from "react";
import type { AuditLog } from "@/types/domain";

type PropertyMeta = {
  propertyTypes?: string[];
  floorLevels?: string[];
  furnishing?: string[];
  listingTypes?: string[];
  propertyStatuses?: string[];
  brokerRoles?: string[];
};

export default function SystemPage() {
  const [meta, setMeta] = useState<PropertyMeta>({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [bootstrapMessage, setBootstrapMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [result, audit] = await Promise.all([
          systemApi.propertyMeta(),
          systemApi.auditLogs({ limit: 8, skip: 0 }),
        ]);
        setMeta(result || {});
        setAuditLogs(audit.items);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const submitWaitlist = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await marketingApi.joinWaitlist({
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
    });
    setStatus("Waitlist entry submitted successfully.");
    event.currentTarget.reset();
  };

  const submitBootstrapAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await brokersApi.createAdmin(
        {
          fname: String(form.get("fname") || ""),
          lname: String(form.get("lname") || ""),
          email: String(form.get("email") || ""),
          phone: String(form.get("phone") || ""),
          dob: String(form.get("dob") || ""),
          password: String(form.get("password") || ""),
        },
        String(form.get("bootstrapSecret") || "")
      );
      setBootstrapMessage("Admin account created successfully.");
      event.currentTarget.reset();
    } catch {
      setBootstrapMessage("Failed to create admin. Verify bootstrap secret and payload.");
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="panel-title">System & Integrations</h2>
      <div className="panel p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Property Metadata (API Integration)
        </h3>
        {loading ? (
          <p className="mt-3 text-sm text-slate-500">Loading metadata...</p>
        ) : (
          <div className="mt-3 grid gap-2 text-sm">
            <p>Property Types: {(meta.propertyTypes || []).join(", ") || "-"}</p>
            <p>Floor Levels: {(meta.floorLevels || []).join(", ") || "-"}</p>
            <p>Furnishing: {(meta.furnishing || []).join(", ") || "-"}</p>
            <p>Listing Types: {(meta.listingTypes || []).join(", ") || "-"}</p>
            <p>Property Statuses: {(meta.propertyStatuses || []).join(", ") || "-"}</p>
            <p>Broker Roles: {(meta.brokerRoles || []).join(", ") || "-"}</p>
          </div>
        )}
      </div>

      <div className="panel p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Marketing Module (Waitlist API)
        </h3>
        <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={submitWaitlist}>
          <input
            name="name"
            required
            placeholder="Name"
            className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700"
          />
          <input
            name="email"
            required
            type="email"
            placeholder="Email"
            className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700"
          />
          <input
            name="phone"
            placeholder="Phone (optional)"
            className="rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700"
          />
          <button
            className="rounded-xl bg-emerald-600 px-3 py-2 text-white md:col-span-3 md:w-fit"
            type="submit"
          >
            Submit to Waitlist Endpoint
          </button>
        </form>
        {status ? <p className="mt-3 text-sm text-emerald-700">{status}</p> : null}
      </div>

      <div className="panel p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Admin Bootstrap Tool
        </h3>
        <p className="mt-2 text-sm muted">
          Create a new admin account using the bootstrap secret (`/admin/create`).
        </p>
        <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={submitBootstrapAdmin}>
          <input name="bootstrapSecret" placeholder="Bootstrap Secret" required className="input md:col-span-3" />
          <input name="fname" placeholder="First name" required className="input" />
          <input name="lname" placeholder="Last name" required className="input" />
          <input name="email" type="email" placeholder="Email" required className="input" />
          <input name="phone" placeholder="Phone (optional)" className="input" />
          <input name="dob" type="date" className="input" />
          <input name="password" type="password" placeholder="Password" required className="input" />
          <button type="submit" className="btn-primary md:col-span-3 md:w-fit">
            Create Admin
          </button>
        </form>
        {bootstrapMessage ? <p className="mt-3 text-sm">{bootstrapMessage}</p> : null}
      </div>

      <div className="panel p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Recent Audit Logs
        </h3>
        <div className="mt-3 space-y-2">
          {auditLogs.length === 0 ? (
            <p className="text-sm muted">No audit logs available.</p>
          ) : (
            auditLogs.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
              >
                <p className="font-medium">{item.event}</p>
                <p className="muted">{item.message}</p>
                <p className="text-xs muted">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
