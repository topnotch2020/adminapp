"use client";

import { brokersApi } from "@/lib/api/modules/brokers";
import { useToast } from "@/components/providers/toast-provider";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { BROKER_ROLE, BROKER_STATUS, brokerRole, brokerStatus } from "@/lib/labels";
import type { Broker } from "@/types/domain";
import { useState } from "react";

export type BrokerStatusValue = NonNullable<Broker["status"]>;
export type BrokerRoleValue = "BROKER" | "ADMIN";

// Only describes what the server actually enforces today
const STATUS_EFFECT: Record<BrokerStatusValue, string> = {
  PENDING_VERIFICATION: "They're shown as awaiting verification.",
  VERIFIED: "They're shown as a verified broker.",
  SUSPENDED: "Admins can no longer post listings on their behalf.",
  BLOCKED: "Admins can no longer post listings on their behalf.",
};

const fullName = (broker: Broker) => `${broker.fname ?? ""} ${broker.lname ?? ""}`.trim() || "this broker";

/**
 * Status / role changes that always go through a confirmation modal.
 * Render {dialog} once in the page.
 */
export function useBrokerControls(onUpdated: (broker: Broker) => void) {
  const { showToast } = useToast();
  const { confirm, dialog } = useConfirm();
  const [savingId, setSavingId] = useState<string | null>(null);

  const changeStatus = async (broker: Broker, next: BrokerStatusValue) => {
    const current = broker.status ?? "PENDING_VERIFICATION";
    if (next === current) return;
    const danger = next === "SUSPENDED" || next === "BLOCKED";
    const { confirmed } = await confirm({
      title: `Change status to ${brokerStatus(next).label}?`,
      description: (
        <>
          <strong>{fullName(broker)}</strong> goes from {brokerStatus(current).label} to{" "}
          {brokerStatus(next).label}. {STATUS_EFFECT[next]}
        </>
      ),
      confirmLabel: `Set ${brokerStatus(next).label}`,
      tone: danger ? "danger" : "primary",
    });
    if (!confirmed) return;

    setSavingId(broker._id);
    try {
      const updated = await brokersApi.updateStatus(broker._id, next);
      onUpdated({ ...broker, ...updated });
      showToast({ type: "success", title: `Status set to ${brokerStatus(next).label}` });
    } catch {
      showToast({ type: "error", title: "Couldn't update status" });
    } finally {
      setSavingId(null);
    }
  };

  const changeRole = async (broker: Broker, next: BrokerRoleValue) => {
    const current = (broker.role as BrokerRoleValue) ?? "BROKER";
    if (next === current) return;
    const { confirmed } = await confirm({
      title: next === "ADMIN" ? "Make this account an admin?" : "Remove admin access?",
      description:
        next === "ADMIN" ? (
          <>
            <strong>{fullName(broker)}</strong> gets full access to this admin console.
          </>
        ) : (
          <>
            <strong>{fullName(broker)}</strong> loses access to this admin console and becomes a broker.
          </>
        ),
      confirmLabel: next === "ADMIN" ? "Make admin" : "Make broker",
      tone: "danger",
    });
    if (!confirmed) return;

    setSavingId(broker._id);
    try {
      const updated = await brokersApi.updateRole(broker._id, next);
      onUpdated({ ...broker, ...updated });
      showToast({ type: "success", title: `Role set to ${brokerRole(next).label}` });
    } catch {
      showToast({ type: "error", title: "Couldn't update role" });
    } finally {
      setSavingId(null);
    }
  };

  return { changeStatus, changeRole, savingId, dialog, confirm };
}

/** Select styled as a coloured pill; the value only changes after confirmation. */
export function StatusSelect({
  broker,
  disabled,
  onChange,
}: {
  broker: Broker;
  disabled?: boolean;
  onChange: (next: BrokerStatusValue) => void;
}) {
  const value = broker.status ?? "PENDING_VERIFICATION";
  return (
    <PillSelect
      value={value}
      tone={brokerStatus(value).tone}
      disabled={disabled}
      label="Status"
      options={Object.entries(BROKER_STATUS).map(([key, info]) => ({ value: key, label: info.label }))}
      onChange={(next) => onChange(next as BrokerStatusValue)}
    />
  );
}

export function RoleSelect({
  broker,
  disabled,
  onChange,
}: {
  broker: Broker;
  disabled?: boolean;
  onChange: (next: BrokerRoleValue) => void;
}) {
  const value = broker.role ?? "BROKER";
  return (
    <PillSelect
      value={value}
      tone={brokerRole(value).tone}
      disabled={disabled}
      label="Role"
      options={Object.entries(BROKER_ROLE).map(([key, info]) => ({ value: key, label: info.label }))}
      onChange={(next) => onChange(next as BrokerRoleValue)}
    />
  );
}

const TONE_COLOR: Record<string, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  primary: "var(--primary)",
  info: "#0284c7",
  neutral: "var(--muted)",
};

function PillSelect({
  value,
  tone,
  options,
  disabled,
  label,
  onChange,
}: {
  value: string;
  tone: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
}) {
  const color = TONE_COLOR[tone] ?? TONE_COLOR.neutral;
  return (
    <select
      aria-label={label}
      value={value}
      disabled={disabled}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => onChange(event.target.value)}
      className="cursor-pointer appearance-none rounded-full border py-0.5 pl-2.5 pr-6 text-xs font-medium outline-none transition disabled:opacity-50"
      style={{
        color,
        background: `color-mix(in srgb, ${color} 13%, transparent) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='3'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 8px center`,
        borderColor: `color-mix(in srgb, ${color} 25%, transparent)`,
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} style={{ color: "initial" }}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
